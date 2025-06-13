import {
    ClsPluginTransactional,
    InjectTransaction,
    Propagation,
    Transaction,
    Transactional,
    TransactionHost,
} from '@nestjs-cls/transactional';
import { Inject, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import { Generated, Kysely, PostgresDialect } from 'kysely';
import { ClsModule } from 'nestjs-cls';
import { Pool } from 'pg';
import { TransactionalAdapterKysely } from '../src';

const KYSELY = 'KYSELY';

interface Database {
    user: User;
}

interface User {
    id: Generated<number>;
    name: string;
    email: string;
}

@Injectable()
class UserRepository {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterKysely<Database>>,
    ) {}

    async getUserById(id: number) {
        return this.tx
            .selectFrom('user')
            .where('id', '=', id)
            .selectAll()
            .executeTakeFirst();
    }

    async createUser(name: string) {
        return this.tx
            .insertInto('user')
            .values({
                name: name,
                email: `${name}@email.com`,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
}

@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly txHost: TransactionHost<
            TransactionalAdapterKysely<Database>
        >,
        @Inject(KYSELY)
        private readonly kysely: Kysely<Database>,
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

    @Transactional<TransactionalAdapterKysely>({
        isolationLevel: 'serializable',
        accessMode: 'read write',
    })
    async transactionWithDecoratorWithOptions() {
        const r1 = await this.userRepository.createUser('James');
        const r2 = await this.kysely
            .selectFrom('user')
            .where('id', '=', r1.id)
            .selectAll()
            .executeTakeFirst();
        const r3 = await this.userRepository.getUserById(r1.id);
        return { r1, r2, r3 };
    }

    @Transactional<TransactionalAdapterKysely>({
        accessMode: 'read only',
    })
    async transactionWithDecoratorWithReadOnlyOptionError() {
        await this.userRepository.createUser('James');
    }

    async transactionWithFunctionWrapper() {
        return this.txHost.withTransaction(
            {
                isolationLevel: 'serializable',
                accessMode: 'read write',
            },
            async () => {
                const r1 = await this.userRepository.createUser('Joe');
                const r2 = await this.kysely
                    .selectFrom('user')
                    .where('id', '=', r1.id)
                    .selectAll()
                    .executeTakeFirst();
                const r3 = await this.userRepository.getUserById(r1.id);
                return { r1, r2, r3 };
            },
        );
    }

    async transactionWithWrapperFunctionWithReadOnlyOptionError() {
        return this.txHost.withTransaction(
            {
                isolationLevel: 'serializable',
                accessMode: 'read only',
            },
            async () => {
                await this.userRepository.createUser('Joe');
            },
        );
    }

    @Transactional()
    async transactionWithDecoratorError() {
        await this.userRepository.createUser('Nobody');
        throw new Error('Rollback');
    }
}

const kyselyDb = new Kysely<Database>({
    dialect: new PostgresDialect({
        pool: new Pool({
            connectionString: 'postgres://postgres:postgres@localhost:5445',
            max: 2,
        }),
    }),
});

@Module({
    providers: [
        {
            provide: KYSELY,
            useValue: kyselyDb,
        },
    ],
    exports: [KYSELY],
})
class KyselyModule {}

@Module({
    imports: [
        KyselyModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [KyselyModule],
                    adapter: new TransactionalAdapterKysely({
                        kyselyInstanceToken: KYSELY,
                    }),
                    enableTransactionProxy: true,
                }),
            ],
        }),
    ],
    providers: [UserService, UserRepository],
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
        await kyselyDb.schema.dropTable('user').ifExists().execute();
        await kyselyDb.schema
            .createTable('user')
            .addColumn('id', 'serial', (column) => column.primaryKey())
            .addColumn('name', 'varchar', (column) => column.notNull())
            .addColumn('email', 'varchar', (column) => column.notNull())
            .execute();
    }, 60_000);

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        callingService = module.get(UserService);
    });

    afterAll(async () => {
        await kyselyDb.destroy();
        execSync('docker compose -f test/docker-compose.yml down', {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
    }, 60_000);

    describe('TransactionalAdapterKysely', () => {
        it('should work without an active transaction', async () => {
            const { r1, r2 } = await callingService.withoutTransaction();
            expect(r1).toEqual(r2);
            const users = await kyselyDb
                .selectFrom('user')
                .selectAll()
                .execute();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the default options with a decorator', async () => {
            const { r1, r2 } = await callingService.transactionWithDecorator();
            expect(r1).toEqual(r2);
            const users = await kyselyDb
                .selectFrom('user')
                .selectAll()
                .execute();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the specified options with a decorator', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithDecoratorWithOptions();
            expect(r1).toEqual(r3);
            expect(r2).toBeUndefined();
            const users = await kyselyDb
                .selectFrom('user')
                .selectAll()
                .execute();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });
        it('should run a transaction with the specified options with a function wrapper', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithFunctionWrapper();
            expect(r1).toEqual(r3);
            expect(r2).toBeUndefined();
            const users = await kyselyDb
                .selectFrom('user')
                .selectAll()
                .execute();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should rollback a transaction on error', async () => {
            await expect(
                callingService.transactionWithDecoratorError(),
            ).rejects.toThrow(new Error('Rollback'));
            const users = await kyselyDb
                .selectFrom('user')
                .selectAll()
                .execute();
            expect(users).toEqual(
                expect.not.arrayContaining([{ name: 'Nobody' }]),
            );
        });

        it('should rollback a transaction with access mode read only from decorator', async () => {
            await expect(
                callingService.transactionWithDecoratorWithReadOnlyOptionError(),
            ).rejects.toThrow(
                new Error('cannot execute INSERT in a read-only transaction'),
            );
        });

        it('should rollback a transaction with access mode read only with a wrapper function', async () => {
            await expect(
                callingService.transactionWithWrapperFunctionWithReadOnlyOptionError(),
            ).rejects.toThrow(
                new Error('cannot execute INSERT in a read-only transaction'),
            );
        });

        describe('Isolation Level', () => {
            let userA;
            let userB;
            let txHost: TransactionHost<TransactionalAdapterKysely<Database>>;

            beforeEach(async () => {
                userA = await kyselyDb
                    .insertInto('user')
                    .values({
                        name: 'User~A',
                        email: 'User~A@email.com',
                    })
                    .returningAll()
                    .executeTakeFirstOrThrow();

                userB = await kyselyDb
                    .insertInto('user')
                    .values({
                        name: 'User~B',
                        email: 'User~B@email.com',
                    })
                    .returningAll()
                    .executeTakeFirstOrThrow();
                txHost = module.get(TransactionHost);
            });

            it('should abort a transaction on serialization anomaly', async () => {
                await expect(
                    txHost.withTransaction(
                        { isolationLevel: 'serializable' },
                        async () => {
                            const { name: userAname } = await txHost.tx
                                .selectFrom('user')
                                .where('id', '=', userA.id)
                                .select('name')
                                .executeTakeFirstOrThrow();

                            await txHost.withTransaction(
                                Propagation.RequiresNew,
                                { isolationLevel: 'serializable' },
                                async () => {
                                    const { name: userBname } = await txHost.tx
                                        .selectFrom('user')
                                        .where('id', '=', userB.id)
                                        .select('name')
                                        .executeTakeFirstOrThrow();

                                    await txHost.tx
                                        .updateTable('user')
                                        .set('name', userBname)
                                        .where('id', '=', userA.id)
                                        .execute();
                                },
                            );

                            await txHost.tx
                                .updateTable('user')
                                .set('name', userAname)
                                .where('id', '=', userB.id)
                                .execute();
                        },
                    ),
                ).rejects.toThrow(
                    new Error(
                        'could not serialize access due to read/write dependencies among transactions',
                    ),
                );
            });
        });
    });
});

describe('Default options', () => {
    it('Should correctly set default options on the adapter instance', async () => {
        const adapter = new TransactionalAdapterKysely({
            kyselyInstanceToken: KYSELY,
            defaultTxOptions: {
                isolationLevel: 'repeatable read',
                accessMode: 'read write',
            },
        });

        expect(adapter.defaultTxOptions).toEqual({
            isolationLevel: 'repeatable read',
            accessMode: 'read write',
        });
    });
});
