import {
    ClsPluginTransactional,
    InjectTransaction, Propagation,
    Transaction,
    Transactional,
    TransactionHost,
} from '@nestjs-cls/transactional';
import { Inject, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { drizzle } from 'drizzle-orm/node-postgres';
import { ClsModule } from 'nestjs-cls';
import { Pool } from 'pg';

import { execSync } from 'child_process';
import { eq } from 'drizzle-orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { TransactionalAdapterDrizzleOrm } from '../src';

const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text().notNull(),
    email: text().notNull(),
});

const DRIZZLE = 'DRIZZLE';

const drizzleClient = drizzle(
    new Pool({
        connectionString: 'postgres://postgres:postgres@localhost:5447',
        max: 2,
    }),
    {
        schema: {
            users,
        },
    },
);

type DrizzleClient = typeof drizzleClient;

@Injectable()
class UserRepository {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<
            TransactionalAdapterDrizzleOrm<DrizzleClient>
        >,
    ) {}

    async getUserById(id: number) {
        const user = await this.tx.query.users.findFirst({
            where: eq(users.id, id),
        });
        return user ?? null;
    }

    async createUser(name: string) {
        const created = await this.tx
            .insert(users)
            .values({
                name: name,
                email: `${name}@email.com`,
            })
            .returning()
            .execute();
        return created[0] ?? null;
    }
}

@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly txHost: TransactionHost<
            TransactionalAdapterDrizzleOrm<DrizzleClient>
        >,
        @Inject(DRIZZLE)
        private readonly drizzleClient: DrizzleClient,
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

    @Transactional<TransactionalAdapterDrizzleOrm<DrizzleClient>>({
        isolationLevel: 'serializable',
    })
    async transactionWithDecoratorWithOptions() {
        const r1 = await this.userRepository.createUser('James');

        const r2 =
            (await this.drizzleClient.query.users.findFirst({
                where: eq(users.id, r1.id),
            })) ?? null;

        const r3 = await this.userRepository.getUserById(r1.id);
        return { r1, r2, r3 };
    }

    async transactionWithFunctionWrapper() {
        return this.txHost.withTransaction(
            {
                isolationLevel: 'serializable',
            },
            async () => {
                const r1 = await this.userRepository.createUser('Joe');
                const r2 =
                    (await this.drizzleClient.query.users.findFirst({
                        where: eq(users.id, r1.id),
                    })) ?? null;
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
            provide: DRIZZLE,
            useValue: drizzleClient,
        },
    ],
    exports: [DRIZZLE],
})
class KnexModule {}

@Module({
    imports: [
        KnexModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [KnexModule],
                    adapter: new TransactionalAdapterDrizzleOrm<DrizzleClient>({
                        drizzleInstanceToken: DRIZZLE,
                        defaultTxOptions: {},
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

        await drizzleClient.$client.query('DROP TABLE IF EXISTS users');
        await drizzleClient.$client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL
            )
        `);
    }, 60_000);

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        callingService = module.get(UserService);
    });

    afterAll(async () => {
        await drizzleClient.$client.end();
        execSync('docker compose -f test/docker-compose.yml down', {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
    }, 60_000);

    describe('TransactionalAdapterDrizzleOrm', () => {
        it('should work without an active transaction', async () => {
            const { r1, r2 } = await callingService.withoutTransaction();
            expect(r1).toEqual(r2);
            const users = await drizzleClient.query.users.findMany();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the default options with a decorator', async () => {
            const { r1, r2 } = await callingService.transactionWithDecorator();
            expect(r1).toEqual(r2);
            const users = await drizzleClient.query.users.findMany();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the specified options with a decorator', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithDecoratorWithOptions();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await drizzleClient.query.users.findMany();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });
        it('should run a transaction with the specified options with a function wrapper', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithFunctionWrapper();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await drizzleClient.query.users.findMany();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should rollback a transaction on error', async () => {
            await expect(
                callingService.transactionWithDecoratorError(),
            ).rejects.toThrow(new Error('Rollback'));
            const users = await drizzleClient.query.users.findMany();
            expect(users).toEqual(
                expect.not.arrayContaining([{ name: 'Nobody' }]),
            );
        });


        it('should work with in nested tx', async () => {
            await callingService.transactionalHasNested('Anybody2');

            const us = await drizzleClient.query.users.findMany({
                where:eq(users.name, 'Anybody2')
            });

            // partial rollback
            expect(us).toHaveLength(1);
        });
    });
});

describe('Default options', () => {
    it('Should correctly set default options on the adapter instance', async () => {
        const adapter = new TransactionalAdapterDrizzleOrm<DrizzleClient>({
            drizzleInstanceToken: DRIZZLE,
            defaultTxOptions: {
                isolationLevel: 'read uncommitted',
                accessMode: 'read write',
            },
        });

        expect(adapter.defaultTxOptions).toEqual({
            isolationLevel: 'read uncommitted',
            accessMode: 'read write',
        });
    });
});
