import {
    ClsPluginTransactional,
    InjectTransaction,
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

    @Transactional()
    async transactionWithDecorator() {
        const r1 = await this.userRepository.createUser('John');
        const r2 = await this.userRepository.getUserById(r1.id);
        return { r1, r2 };
    }

    @Transactional<TransactionalAdapterKysely>({
        isolationLevel: 'serializable',
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

    async transactionWithFunctionWrapper() {
        return this.txHost.withTransaction(
            {
                isolationLevel: 'serializable',
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
class KnexModule {}

@Module({
    imports: [
        KnexModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [KnexModule],
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
    });
});
