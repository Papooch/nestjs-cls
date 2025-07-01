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
import Knex from 'knex';
import { ClsModule } from 'nestjs-cls';
import { TransactionalAdapterKnex } from '../src';

const KNEX = 'KNEX';

@Injectable()
class UserRepository {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterKnex>,
    ) {}

    async getUserById(id: number) {
        return this.tx('user').where({ id }).first();
    }

    async createUser(name: string) {
        const created = await this.tx('user')
            .insert({ name: name, email: `${name}@email.com` })
            .returning('*');
        return created[0] ?? null;
    }
}

@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly txHost: TransactionHost<TransactionalAdapterKnex>,
        @Inject(KNEX)
        private readonly knex: Knex.Knex,
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

    @Transactional<TransactionalAdapterKnex>({
        isolationLevel: 'serializable',
    })
    async transactionWithDecoratorWithOptions() {
        const r1 = await this.userRepository.createUser('James');
        const r2 =
            (await this.knex('user').where({ id: r1.id }).first()) ?? null;
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
                    (await this.knex('user').where({ id: r1.id }).first()) ??
                    null;
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

const knex = Knex({
    client: 'sqlite',
    connection: {
        filename: 'test.db',
    },
    useNullAsDefault: true,
    pool: { min: 1, max: 2 },
});

@Module({
    providers: [
        {
            provide: KNEX,
            useValue: knex,
        },
    ],
    exports: [KNEX],
})
class KnexModule {}

@Module({
    imports: [
        KnexModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [KnexModule],
                    adapter: new TransactionalAdapterKnex({
                        knexInstanceToken: KNEX,
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
        await knex.schema.dropTableIfExists('user');
        await knex.schema.createTable('user', (table) => {
            table.increments('id');
            table.string('name');
            table.string('email');
        });
    });

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        callingService = module.get(UserService);
    });

    afterAll(async () => {
        await knex.destroy();
    });

    describe('TransactionalAdapterKnex', () => {
        it('should work without an active transaction', async () => {
            const { r1, r2 } = await callingService.withoutTransaction();
            expect(r1).toEqual(r2);
            const users = await knex('user');
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the default options with a decorator', async () => {
            const { r1, r2 } = await callingService.transactionWithDecorator();
            expect(r1).toEqual(r2);
            const users = await knex('user');
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the specified options with a decorator', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithDecoratorWithOptions();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await knex('user');
            expect(users).toEqual(expect.arrayContaining([r1]));
        });
        it('should run a transaction with the specified options with a function wrapper', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithFunctionWrapper();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await knex('user');
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should rollback a transaction on error', async () => {
            await expect(
                callingService.transactionWithDecoratorError(),
            ).rejects.toThrow(new Error('Rollback'));
            const users = await knex('user');
            expect(users).toEqual(
                expect.not.arrayContaining([{ name: 'Nobody' }]),
            );
        });

        it('should work with in nested tx', async () => {
            await callingService.transactionalHasNested('Anybody2');

            const users = await knex('user').where({ name: 'Anybody2' });

            // partial rollback
            expect(users).toHaveLength(1);
        });
    });
});

describe('Default options', () => {
    it('Should correctly set default options on the adapter instance', async () => {
        const adapter = new TransactionalAdapterKnex({
            knexInstanceToken: KNEX,
            defaultTxOptions: {
                isolationLevel: 'snapshot',
            },
        });

        expect(adapter.defaultTxOptions).toEqual({
            isolationLevel: 'snapshot',
        });
    });
});
