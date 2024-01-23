import {
    ClsPluginTransactional,
    Transactional,
    TransactionHost,
} from '@nestjs-cls/transactional';
import { Inject, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { Database, TransactionalAdapterPgPromise } from '../src';
import pgPromise from 'pg-promise';
import { execSync } from 'node:child_process';

type UserRecord = { id: number; name: string; email: string };

const PG_PROMISE = 'PG_PROMISE';

const pgp = pgPromise();
const db = pgp({
    host: 'localhost',
    port: 5444,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
});

const { TransactionMode, isolationLevel } = pgp.txMode;
const transactionMode = new TransactionMode({
    tiLevel: isolationLevel.serializable,
});

@Injectable()
class UserRepository {
    constructor(
        private readonly txHost: TransactionHost<TransactionalAdapterPgPromise>,
    ) {}

    async getUserById(id: number) {
        return this.txHost.tx.one<UserRecord>(
            'SELECT * FROM public.user WHERE id = $1',
            [id],
        );
    }

    async createUser(name: string) {
        const created = await this.txHost.tx.one<UserRecord>(
            'INSERT INTO public.user (name, email) VALUES ($1, $2) RETURNING *',
            [name, `${name}@email.com`],
        );
        return created;
    }
}

@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly txHost: TransactionHost<TransactionalAdapterPgPromise>,
        @Inject(PG_PROMISE)
        private readonly db: Database,
    ) {}

    @Transactional()
    async transactionWithDecorator() {
        const r1 = await this.userRepository.createUser('John');
        const r2 = await this.userRepository.getUserById(r1.id);
        return { r1, r2 };
    }

    @Transactional<TransactionalAdapterPgPromise>({ mode: transactionMode })
    async transactionWithDecoratorWithOptions() {
        const r1 = await this.userRepository.createUser('James');
        const r2 = await this.db.oneOrNone<UserRecord>(
            'SELECT * FROM public.user WHERE id = $1',
            [r1.id],
        );
        const r3 = await this.userRepository.getUserById(r1.id);
        return { r1, r2, r3 };
    }

    async transactionWithFunctionWrapper() {
        return this.txHost.withTransaction(
            { mode: transactionMode },
            async () => {
                const r1 = await this.userRepository.createUser('Joe');
                const r2 = await this.db.oneOrNone<UserRecord>(
                    'SELECT * FROM public.user WHERE id = $1',
                    [r1.id],
                );
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
            provide: PG_PROMISE,
            useValue: db,
        },
    ],
    exports: [PG_PROMISE],
})
class PgPromiseModule {}

@Module({
    imports: [
        PgPromiseModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [PgPromiseModule],
                    adapter: new TransactionalAdapterPgPromise({
                        dbInstanceToken: PG_PROMISE,
                    }),
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
            'docker-compose -f test/docker-compose.yml up -d --quiet-pull --wait',
            {
                stdio: 'inherit',
                cwd: process.cwd(),
            },
        );
        await db.query('DROP TABLE IF EXISTS public.user');
        await db.query(`CREATE TABLE public.user (
          id serial NOT NULL,
          name varchar NOT NULL,
          email varchar NOT NULL,
          CONSTRAINT user_pk PRIMARY KEY (id)
        );`);
    }, 60_000);

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        callingService = module.get(UserService);
    });

    afterAll(async () => {
        pgp.end();
        execSync('docker-compose -f test/docker-compose.yml down', {
            stdio: 'inherit',
        });
    }, 60_000);

    describe('TransactionalAdapterPgPromise', () => {
        it('should run a transaction with the default options with a decorator', async () => {
            const { r1, r2 } = await callingService.transactionWithDecorator();
            expect(r1).toEqual(r2);
            const users = await db.many<UserRecord>(
                'SELECT * FROM public.user',
            );
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the specified options with a decorator', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithDecoratorWithOptions();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await db.many<UserRecord>(
                'SELECT * FROM public.user',
            );
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the specified options with a function wrapper', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithFunctionWrapper();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await db.many<UserRecord>(
                'SELECT * FROM public.user',
            );
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should rollback a transaction on error', async () => {
            await expect(
                callingService.transactionWithDecoratorError(),
            ).rejects.toThrow(new Error('Rollback'));
            const users = await db.many<UserRecord>(
                'SELECT * FROM public.user',
            );
            expect(users).toEqual(
                expect.not.arrayContaining([{ name: 'Nobody' }]),
            );
        });
    });
});
