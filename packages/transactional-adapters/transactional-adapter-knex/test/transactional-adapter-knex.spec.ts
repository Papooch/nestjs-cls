import {
    ClsPluginTransactional,
    Transactional,
    TransactionHost,
} from '@nestjs-cls/transactional';
import { Inject, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import Knex from 'knex';
import { TransactionalAdapterKnex } from '../src';

const KNEX = 'KNEX';

@Injectable()
class UserRepository {
    constructor(
        private readonly txHost: TransactionHost<TransactionalAdapterKnex>,
    ) {}

    async getUserById(id: number) {
        return this.txHost.tx('user').where({ id }).first();
    }

    async createUser(name: string) {
        const created = await this.txHost
            .tx('user')
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
    });
});
