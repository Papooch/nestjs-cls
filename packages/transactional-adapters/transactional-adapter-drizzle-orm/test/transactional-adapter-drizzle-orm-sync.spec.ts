import {
    ClsPluginTransactional,
    InjectTransaction,
    Propagation,
    Transaction,
    Transactional,
} from '@nestjs-cls/transactional';
import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ClsModule } from 'nestjs-cls';
import { TransactionalAdapterDrizzleOrm } from '../src';

const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull(),
});

const DRIZZLE = 'DRIZZLE';

const sqlite = new Database(':memory:');
const drizzleClient = drizzle(sqlite, { schema: { users } });

type DrizzleClient = typeof drizzleClient;

@Injectable()
class UserRepository {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<
            TransactionalAdapterDrizzleOrm<DrizzleClient>
        >,
    ) {}

    getUserById(id: number) {
        const user = this.tx.select().from(users).where(eq(users.id, id)).get();
        return user ?? null;
    }

    createUser(name: string) {
        const created = this.tx
            .insert(users)
            .values({ name, email: `${name}@email.com` })
            .returning()
            .get();
        if (!created) throw new Error('insert returned no row');
        return created;
    }
}

@Injectable()
class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    withoutTransaction() {
        const r1 = this.userRepository.createUser('Jim');
        const r2 = this.userRepository.getUserById(r1.id);
        return { r1, r2 };
    }

    @Transactional()
    transactionWithDecorator() {
        const r1 = this.userRepository.createUser('John');
        const r2 = this.userRepository.getUserById(r1.id);
        return { r1, r2 };
    }

    @Transactional()
    transactionWithDecoratorError() {
        this.userRepository.createUser('Nobody');
        throw new Error('Rollback');
    }

    @Transactional(Propagation.Nested)
    nestedTransaction(name = 'Anybody') {
        this.userRepository.createUser(name);
    }

    @Transactional()
    outerCommitsTwoNested(name: string) {
        this.nestedTransaction(name);
        this.nestedTransaction(`${name}-2`);
    }

    @Transactional()
    outerThrowsAfterNested(name: string) {
        this.nestedTransaction(name);
        throw new Error('outer-rollback');
    }
}

@Module({
    providers: [{ provide: DRIZZLE, useValue: drizzleClient }],
    exports: [DRIZZLE],
})
class DbModule {}

@Module({
    imports: [
        DbModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [DbModule],
                    adapter: new TransactionalAdapterDrizzleOrm<DrizzleClient>({
                        drizzleInstanceToken: DRIZZLE,
                        // no transactionMode — exercising auto-detection
                    }),
                    enableTransactionProxy: true,
                }),
            ],
        }),
    ],
    providers: [UserService, UserRepository],
})
class AppModule {}

describe('TransactionalAdapterDrizzleOrm (sync / better-sqlite3)', () => {
    let module: TestingModule;
    let svc: UserService;

    beforeAll(() => {
        sqlite.exec(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL
            );
        `);
    });

    beforeEach(async () => {
        sqlite.exec('DELETE FROM users');
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        svc = module.get(UserService);
    });

    afterAll(() => {
        sqlite.close();
    });

    // T4 — outside @Transactional, falls back to raw client
    it('should work without an active transaction (T4)', () => {
        const { r1, r2 } = svc.withoutTransaction();
        expect(r1).toEqual(r2);
        const rows = drizzleClient.select().from(users).all();
        expect(rows).toEqual(expect.arrayContaining([r1]));
    });

    // T1 — insert + read inside @Transactional persists
    it('should run a transaction with the default options with a decorator (T1)', async () => {
        const { r1, r2 } = (await svc.transactionWithDecorator()) as any;
        expect(r1).toEqual(r2);
        const rows = drizzleClient.select().from(users).all();
        expect(rows).toEqual(expect.arrayContaining([r1]));
    });

    // T2 — throw inside @Transactional rolls back (no rows)
    it('should rollback a transaction on error (T2)', async () => {
        await expect(svc.transactionWithDecoratorError()).rejects.toThrow(
            'Rollback',
        );
        const rows = drizzleClient.select().from(users).all();
        expect(rows.filter((u) => u.name === 'Nobody')).toHaveLength(0);
    });

    // T3 — nested @Transactional uses savepoints
    it('should commit both nested transactions when outer succeeds (T3a)', async () => {
        await svc.outerCommitsTwoNested('Multi');

        const matches = drizzleClient
            .select()
            .from(users)
            .where(eq(users.name, 'Multi'))
            .all();
        const matches2 = drizzleClient
            .select()
            .from(users)
            .where(eq(users.name, 'Multi-2'))
            .all();
        expect(matches).toHaveLength(1);
        expect(matches2).toHaveLength(1);
    });

    it('should rollback nested transactions when outer throws (T3b)', async () => {
        await expect(svc.outerThrowsAfterNested('Doomed')).rejects.toThrow(
            'outer-rollback',
        );

        const matches = drizzleClient
            .select()
            .from(users)
            .where(eq(users.name, 'Doomed'))
            .all();
        expect(matches).toHaveLength(0);
    });
});

describe('TransactionalAdapterDrizzleOrm transactionMode resolution', () => {
    it('defaults to "auto" when transactionMode is omitted', () => {
        const adapter = new TransactionalAdapterDrizzleOrm<DrizzleClient>({
            drizzleInstanceToken: DRIZZLE,
        });
        expect((adapter as any).transactionMode).toBe('auto');
    });

    it('auto-detects sync mode from Drizzle\'s resultKind: "sync" (better-sqlite3 et al.)', async () => {
        const adapter = new TransactionalAdapterDrizzleOrm<DrizzleClient>({
            drizzleInstanceToken: DRIZZLE,
        });
        const syncClient = {
            resultKind: 'sync',
            transaction: jest.fn((cb: any) => cb({})),
        } as unknown as DrizzleClient;

        const { wrapWithTransaction } = adapter.optionsFactory(syncClient);
        const callback = jest.fn(() => 'ok') as any;
        const result = await wrapWithTransaction({} as any, callback, () => {});

        expect(result).toBe('ok');
        // sync mode passes a non-async callback to driver.transaction
        const passedFn = (syncClient.transaction as jest.Mock).mock.calls[0][0];
        expect(passedFn.constructor.name).toBe('Function'); // not AsyncFunction
    });

    it('auto-detects async mode when resultKind is "async" or absent', async () => {
        const adapter = new TransactionalAdapterDrizzleOrm<DrizzleClient>({
            drizzleInstanceToken: DRIZZLE,
        });
        const asyncClient = {
            transaction: jest.fn(async (cb: any) => cb({})),
        } as unknown as DrizzleClient;

        const { wrapWithTransaction } = adapter.optionsFactory(asyncClient);
        await wrapWithTransaction(
            {} as any,
            async () => 'ok',
            () => {},
        );

        // async mode passes an AsyncFunction to driver.transaction
        const passedFn = (asyncClient.transaction as jest.Mock).mock
            .calls[0][0];
        expect(passedFn.constructor.name).toBe('AsyncFunction');
    });

    it('respects explicit transactionMode: "sync" override on an async client', async () => {
        const adapter = new TransactionalAdapterDrizzleOrm<DrizzleClient>({
            drizzleInstanceToken: DRIZZLE,
            transactionMode: 'sync',
        });
        const client = {
            // no resultKind — would auto-detect to async, but we override
            transaction: jest.fn((cb: any) => cb({})),
        } as unknown as DrizzleClient;

        const { wrapWithTransaction } = adapter.optionsFactory(client);
        await wrapWithTransaction({} as any, (() => 'ok') as any, () => {});

        const passedFn = (client.transaction as jest.Mock).mock.calls[0][0];
        expect(passedFn.constructor.name).toBe('Function');
    });

    it('respects explicit transactionMode: "async" override on a sync client', async () => {
        const adapter = new TransactionalAdapterDrizzleOrm<DrizzleClient>({
            drizzleInstanceToken: DRIZZLE,
            transactionMode: 'async',
        });
        const client = {
            resultKind: 'sync',
            transaction: jest.fn(async (cb: any) => cb({})),
        } as unknown as DrizzleClient;

        const { wrapWithTransaction } = adapter.optionsFactory(client);
        await wrapWithTransaction(
            {} as any,
            async () => 'ok',
            () => {},
        );

        const passedFn = (client.transaction as jest.Mock).mock.calls[0][0];
        expect(passedFn.constructor.name).toBe('AsyncFunction');
    });
});
