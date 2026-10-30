import { jest } from '@jest/globals';
import {
    ClsPluginTransactional,
    InjectTransaction,
    Propagation,
    type Transaction,
    Transactional,
    TransactionHost,
} from '@nestjs-cls/transactional';
import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { execSync } from 'node:child_process';
import { Column, DataSource, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TransactionalAdapterTypeOrm } from '../src';

@Entity()
class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name?: string;

    @Column()
    email?: string;
}

const connectionOptions = {
    host: 'localhost',
    port: 5446,
    username: 'postgres',
    password: 'postgres',
    database: 'postgres',
};

const dataSource = new DataSource({
    type: 'postgres',
    // Configured with replication so the `slave` transaction mode has a replica
    // to route to. Both master and replicas point at the same database (there
    // is a single test instance), which is enough to exercise the routing.
    replication: {
        master: connectionOptions,
        slaves: [connectionOptions],
    },
    entities: [User],
    synchronize: true,
});

@Injectable()
class UserRepository {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterTypeOrm>,
    ) {}

    async getUserById(id: number) {
        return await this.tx.getRepository(User).findOneBy({ id });
    }

    async createUser(name: string) {
        return await this.tx.getRepository(User).save({
            name,
            email: `${name}@email.com`,
        });
    }
}

@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly transactionHost: TransactionHost<TransactionalAdapterTypeOrm>,
        private readonly dataSource: DataSource,
    ) {}

    async withoutTransaction() {
        const r1 = await this.userRepository.createUser('Jim');
        const r2 = await this.userRepository.getUserById(r1.id);
        return { r1, r2 };
    }

    @Transactional()
    async transactionWithDecorator() {
        const r1 = await this.userRepository.createUser('John');
        const r2 = await this.userRepository.getUserById(r1.id);
        return { r1, r2 };
    }

    @Transactional<TransactionalAdapterTypeOrm>({
        isolationLevel: 'SERIALIZABLE',
    })
    async transactionWithDecoratorWithOptions() {
        const r1 = await this.userRepository.createUser('James');
        const r2 = await this.dataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .where('user.id = :id', { id: r1.id })
            .getOne();
        const r3 = await this.userRepository.getUserById(r1.id);
        return { r1, r2, r3 };
    }

    async transactionWithFunctionWrapper() {
        return this.transactionHost.withTransaction(
            { isolationLevel: 'SERIALIZABLE' },
            async () => {
                const r1 = await this.userRepository.createUser('Joe');
                const r2 = await this.dataSource
                    .getRepository(User)
                    .createQueryBuilder('user')
                    .where('user.id = :id', { id: r1.id })
                    .getOne();
                const r3 = await this.userRepository.getUserById(r1.id);
                return { r1, r2, r3 };
            },
        );
    }

    @Transactional()
    async transactionWithDecoratorError() {
        await this.userRepository.createUser('Nobody');
        throw new Error('Rollback');
    }

    @Transactional<TransactionalAdapterTypeOrm>({
        mode: 'slave',
        isolationLevel: 'SERIALIZABLE',
    })
    async readInSlaveModeWithIsolationLevel(id: number) {
        return await this.userRepository.getUserById(id);
    }

    @Transactional<TransactionalAdapterTypeOrm>({ mode: 'slave' })
    async readInSlaveMode(id: number) {
        return await this.dataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .where('user.id = :id', { id })
            .getOne();
    }

    async readInSlaveModeWithFunctionWrapper(id: number) {
        return this.transactionHost.withTransaction(
            { mode: 'slave' },
            async () => this.userRepository.getUserById(id),
        );
    }

    @Transactional<TransactionalAdapterTypeOrm>({ mode: 'slave' })
    async slaveModeError() {
        await this.userRepository.getUserById(1);
        throw new Error('Rollback');
    }

    @Transactional<TransactionalAdapterTypeOrm>({ mode: 'slave' })
    async slaveModeHasNested() {
        await this.nestedSlaveTransaction();
    }

    @Transactional<TransactionalAdapterTypeOrm>(Propagation.Nested, {
        mode: 'slave',
    })
    async nestedSlaveTransaction() {
        await this.userRepository.getUserById(1);
    }

    @Transactional()
    async transactionalHasNested(name?: string) {
        await this.nestedTransaction(name);
        try {
            await this.nestedTransactionError(name);
        } catch (_: any) {}
    }

    @Transactional(Propagation.Nested)
    async nestedTransaction(name = 'Anybody') {
        await this.userRepository.createUser(name);
    }

    @Transactional(Propagation.Nested)
    async nestedTransactionError(name = 'Anybody') {
        await this.userRepository.createUser(name);
        throw new Error();
    }
}

@Module({
    providers: [
        {
            provide: DataSource,
            useValue: dataSource,
        },
        UserRepository,
        UserService,
    ],
    exports: [DataSource],
})
class TypeOrmModule {}

@Module({
    imports: [
        TypeOrmModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [TypeOrmModule],
                    adapter: new TransactionalAdapterTypeOrm({
                        dataSourceToken: DataSource,
                    }),
                    enableTransactionProxy: true,
                }),
            ],
        }),
    ],
    providers: [UserRepository, UserService],
})
class AppModule {}

describe('Transactional', () => {
    let module: TestingModule;
    let callingService: UserService;

    beforeAll(async () => {
        execSync(
            'docker compose -f test/docker-compose.yml up -d --quiet-pull --wait',
            {
                stdio: 'inherit',
                cwd: process.cwd(),
            },
        );
        await dataSource.initialize();

        await dataSource.query('DROP TABLE IF EXISTS "User"');
        await dataSource.synchronize();
    }, 60_000);

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        callingService = module.get(UserService);
    });

    afterAll(async () => {
        await dataSource.destroy();
        execSync('docker compose -f test/docker-compose.yml down', {
            stdio: 'inherit',
        });
    }, 60_000);

    describe('TransactionalAdapterTypeOrmPromise', () => {
        it('should work without an active transaction', async () => {
            const { r1, r2 } = await callingService.withoutTransaction();
            expect(r1).toEqual(r2);
            const users = await dataSource.manager.find(User);
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should work with in nested tx', async () => {
            await callingService.transactionalHasNested('Anybody2');

            const users = await dataSource.manager.find(User, {
                where: {
                    name: 'Anybody2',
                },
            });

            // partial rollback
            expect(users).toHaveLength(1);
        });

        it('should run a transaction with the default options with a decorator', async () => {
            const { r1, r2 } = await callingService.transactionWithDecorator();
            expect(r1).toEqual(r2);
            const users = await dataSource.manager.find(User);
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the specified options with a decorator', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithDecoratorWithOptions();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await dataSource.manager.find(User);
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the specified options with a function wrapper', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithFunctionWrapper();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await dataSource.manager.find(User);
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should rollback a transaction on error', async () => {
            await expect(
                callingService.transactionWithDecoratorError(),
            ).rejects.toThrow(new Error('Rollback'));
            const users = await dataSource.manager.find(User);
            expect(users).toEqual(
                expect.not.arrayContaining([{ name: 'Nobody' }]),
            );
        });
    });

    describe('Slave mode', () => {
        let createQueryRunnerSpy: ReturnType<typeof jest.spyOn>;
        let startTransactionSpy: ReturnType<typeof jest.spyOn>;

        beforeEach(() => {
            const original = dataSource.createQueryRunner.bind(dataSource);
            createQueryRunnerSpy = jest
                .spyOn(dataSource, 'createQueryRunner')
                .mockImplementation((mode) => {
                    const queryRunner = original(mode);
                    startTransactionSpy = jest.spyOn(
                        queryRunner,
                        'startTransaction',
                    );
                    return queryRunner;
                });
        });

        afterEach(() => {
            startTransactionSpy?.mockRestore();
            createQueryRunnerSpy.mockRestore();
        });

        it('should route the transaction to a replica query runner', async () => {
            const user = await callingService.withoutTransaction();

            const found = await callingService.readInSlaveMode(user.r1.id);

            expect(found).toEqual(user.r1);
            expect(createQueryRunnerSpy).toHaveBeenCalledWith('slave');
        });

        it('should route to a replica with the function wrapper', async () => {
            const user = await callingService.withoutTransaction();

            const found =
                await callingService.readInSlaveModeWithFunctionWrapper(
                    user.r1.id,
                );

            expect(found).toEqual(user.r1);
            expect(createQueryRunnerSpy).toHaveBeenCalledWith('slave');
        });

        it('should start the replica transaction with the given isolation level', async () => {
            const user = await callingService.withoutTransaction();

            const found =
                await callingService.readInSlaveModeWithIsolationLevel(
                    user.r1.id,
                );

            expect(found).toEqual(user.r1);
            expect(createQueryRunnerSpy).toHaveBeenCalledWith('slave');

            const queryRunner = createQueryRunnerSpy.mock.results[0]
                .value as ReturnType<DataSource['createQueryRunner']>;
            expect(startTransactionSpy).toHaveBeenCalledWith('SERIALIZABLE');
            expect(queryRunner.isReleased).toBe(true);
        });

        it('should release the query runner on error', async () => {
            await expect(callingService.slaveModeError()).rejects.toThrow(
                new Error('Rollback'),
            );

            const queryRunner = createQueryRunnerSpy.mock.results[0]
                .value as ReturnType<DataSource['createQueryRunner']>;
            expect(queryRunner.isReleased).toBe(true);
        });

        it('should not support nested transactions', async () => {
            await expect(callingService.slaveModeHasNested()).rejects.toThrow(
                new Error(
                    'Nested transactions are not supported in slave mode',
                ),
            );
        });
    });
});

describe('Default options', () => {
    it('Should correctly set default options on the adapter instance', async () => {
        const adapter = new TransactionalAdapterTypeOrm({
            dataSourceToken: DataSource,
            defaultTxOptions: {
                isolationLevel: 'READ COMMITTED',
            },
        });

        expect(adapter.defaultTxOptions).toEqual({
            isolationLevel: 'READ COMMITTED',
        });
    });
});
