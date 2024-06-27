/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    ClsPluginTransactional,
    InjectTransaction,
    Transaction,
    Transactional,
    TransactionHost,
} from '@nestjs-cls/transactional';
import { Inject, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoClient, ObjectId, WriteConcern } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ClsModule, UseCls } from 'nestjs-cls';
import { TransactionalAdapterMongoDB } from '../src';

const MONGO_CLIENT = 'MONGO_CLIENT';

@Injectable()
class UserRepository {
    constructor(
        @InjectTransaction()
        private readonly session: Transaction<TransactionalAdapterMongoDB>,
        @Inject(MONGO_CLIENT)
        private readonly mongo: MongoClient,
    ) {}

    async getUserById(id: ObjectId) {
        return this.mongo
            .db('default')
            .collection('user')
            .findOne({ _id: id }, { session: this.session });
    }

    async createUser(name: string) {
        const created = await this.mongo
            .db('default')
            .collection('user')
            .insertOne(
                { name: name, email: `${name}@email.com` },
                { session: this.session },
            );
        const createdId = created.insertedId;
        const createdUser = await this.getUserById(createdId);
        return createdUser;
    }
}

@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly txHost: TransactionHost<TransactionalAdapterMongoDB>,
        @Inject(MONGO_CLIENT)
        private readonly mongo: MongoClient,
    ) {}

    @UseCls()
    async withoutTransaction() {
        const r1 = await this.userRepository.createUser('Jim');
        const r2 = await this.userRepository.getUserById(r1!._id);
        return { r1, r2 };
    }

    @Transactional()
    async transactionWithDecorator() {
        const r1 = await this.userRepository.createUser('John');
        const r2 = await this.userRepository.getUserById(r1!._id);

        return { r1, r2 };
    }

    @Transactional<TransactionalAdapterMongoDB>({
        writeConcern: new WriteConcern('majority'),
    })
    async transactionWithDecoratorWithOptions() {
        const r1 = await this.userRepository.createUser('James');
        const r2 = await this.mongo
            .db('default')
            .collection('user')
            .findOne({ _id: r1!._id });
        const r3 = await this.userRepository.getUserById(r1!._id);
        return { r1, r2, r3 };
    }

    async transactionWithFunctionWrapper() {
        return this.txHost.withTransaction(
            {
                writeConcern: new WriteConcern('majority'),
            },
            async () => {
                const r1 = await this.userRepository.createUser('Joe');
                const r2 = await this.mongo
                    .db('default')
                    .collection('user')
                    .findOne({ _id: r1!._id });
                const r3 = await this.userRepository.getUserById(r1!._id);
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

const replSet = new MongoMemoryReplSet({
    replSet: { count: 2, dbName: 'default' },
});

@Module({
    providers: [
        {
            provide: MONGO_CLIENT,
            useFactory: async () => {
                const mongo = new MongoClient(replSet.getUri());
                await mongo.connect();
                return mongo;
            },
        },
    ],
    exports: [MONGO_CLIENT],
})
class MongoDBModule {}

@Module({
    imports: [
        MongoDBModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [MongoDBModule],
                    adapter: new TransactionalAdapterMongoDB({
                        mongoClientToken: MONGO_CLIENT,
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
    let mongo: MongoClient;
    let module: TestingModule;
    let callingService: UserService;

    beforeAll(async () => {
        await replSet.start();
    });

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        callingService = module.get(UserService);
        mongo = module.get(MONGO_CLIENT);

        await mongo.db('default').createCollection('user');
    });

    afterEach(async () => {
        await mongo.db('default').dropCollection('user');
        await mongo?.close();
    });

    afterAll(async () => {
        await replSet.stop({ force: true });
    });

    describe('TransactionalAdapterKnex', () => {
        it('should work without an active transaction', async () => {
            const { r1, r2 } = await callingService.withoutTransaction();
            expect(r1).toEqual(r2);
            const users = await mongo
                .db('default')
                .collection('user')
                .find()
                .toArray();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the default options with a decorator', async () => {
            const { r1, r2 } = await callingService.transactionWithDecorator();
            expect(r1).toEqual(r2);
            const users = await mongo
                .db('default')
                .collection('user')
                .find()
                .toArray();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the specified options with a decorator', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithDecoratorWithOptions();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await mongo
                .db('default')
                .collection('user')
                .find()
                .toArray();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });
        it('should run a transaction with the specified options with a function wrapper', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithFunctionWrapper();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await mongo
                .db('default')
                .collection('user')
                .find()
                .toArray();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should rollback a transaction on error', async () => {
            await expect(
                callingService.transactionWithDecoratorError(),
            ).rejects.toThrow(new Error('Rollback'));
            const users = await mongo
                .db('default')
                .collection('user')
                .find()
                .toArray();
            expect(users).toEqual(
                expect.not.arrayContaining([{ name: 'Nobody' }]),
            );
        });
    });
});

describe('Default options', () => {
    it('Should correctly set default options on the adapter instance', async () => {
        const adapter = new TransactionalAdapterMongoDB({
            mongoClientToken: MONGO_CLIENT,
            defaultTxOptions: {
                readConcern: { level: 'snapshot' },
            },
        });

        expect(adapter.defaultTxOptions).toEqual({
            readConcern: { level: 'snapshot' },
        });
    });
});
