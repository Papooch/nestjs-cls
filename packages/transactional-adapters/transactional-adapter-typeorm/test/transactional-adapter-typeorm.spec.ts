import {
    ClsPluginTransactional,
    InjectTransaction,
    Transaction,
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

const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5446,
    username: 'postgres',
    password: 'postgres',
    database: 'postgres',
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
