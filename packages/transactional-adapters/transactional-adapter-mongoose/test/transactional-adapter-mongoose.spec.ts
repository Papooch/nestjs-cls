/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    ClsPluginTransactional,
    Transactional,
    TransactionHost,
} from '@nestjs-cls/transactional';
import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId, WriteConcern } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose, { Connection, Schema } from 'mongoose';
import { ClsModule } from 'nestjs-cls';
import { TransactionalAdapterMongoose } from '../src';

const MONGOOSE_CONNECTION = 'MONGOOSE_CONNECTION';

const userSchema = new Schema({
    name: String,
    email: String,
});

const User = mongoose.model('user', userSchema);

@Injectable()
class UserRepository {
    constructor(
        private readonly txHost: TransactionHost<TransactionalAdapterMongoose>,
    ) {}

    async getUserById(id: ObjectId) {
        const user = await User.findById(id).session(this.txHost.tx).lean();
        return user;
    }

    async createUser(name: string) {
        const user = new User({ name: name, email: `${name}@email.com` });
        await user.save({ session: this.txHost.tx });
        return user.toObject();
    }
}

@Injectable()
class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly txHost: TransactionHost<TransactionalAdapterMongoose>,
    ) {}

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

    @Transactional<TransactionalAdapterMongoose>({
        writeConcern: new WriteConcern('majority'),
    })
    async transactionWithDecoratorWithOptions() {
        const r1 = await this.userRepository.createUser('James');
        const r2 = await User.findOne({ _id: r1._id }).lean();
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
                const r2 = await User.findOne({ _id: r1!._id }).lean();
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
            provide: MONGOOSE_CONNECTION,
            useFactory: async () => {
                const mongo = await mongoose.connect(replSet.getUri());
                return mongo.connection;
            },
        },
    ],
    exports: [MONGOOSE_CONNECTION],
})
class MongooseModule {}

@Module({
    imports: [
        MongooseModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [MongooseModule],
                    adapter: new TransactionalAdapterMongoose({
                        mongooseConnectionToken: MONGOOSE_CONNECTION,
                    }),
                }),
            ],
        }),
    ],
    providers: [UserService, UserRepository],
})
class AppModule {}

describe('Transactional', () => {
    let mongo: Connection;
    let module: TestingModule;
    let callingService: UserService;

    beforeAll(async () => {
        await replSet.start();
    }, 30_000);

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        callingService = module.get(UserService);
        mongo = module.get(MONGOOSE_CONNECTION);
    });

    afterEach(async () => {
        await User.deleteMany();
    });

    afterAll(async () => {
        await mongo.destroy();
        await replSet.stop({ force: true });
    });

    describe('TransactionalAdapterMongoose', () => {
        it('should work without an active transaction', async () => {
            const { r1, r2 } = await callingService.withoutTransaction();
            expect(r1).toEqual(r2);
            const users = await User.find().lean();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the default options with a decorator', async () => {
            const { r1, r2 } = await callingService.transactionWithDecorator();
            expect(r1).toEqual(r2);
            const users = await User.find().lean();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should run a transaction with the specified options with a decorator', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithDecoratorWithOptions();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await User.find().lean();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });
        it('should run a transaction with the specified options with a function wrapper', async () => {
            const { r1, r2, r3 } =
                await callingService.transactionWithFunctionWrapper();
            expect(r1).toEqual(r3);
            expect(r2).toBeNull();
            const users = await User.find().lean();
            expect(users).toEqual(expect.arrayContaining([r1]));
        });

        it('should rollback a transaction on error', async () => {
            await expect(
                callingService.transactionWithDecoratorError(),
            ).rejects.toThrow(new Error('Rollback'));
            const users = await User.find().lean();
            expect(users).toEqual(
                expect.not.arrayContaining([{ name: 'Nobody' }]),
            );
        });
    });
});

describe('Default options', () => {
    it('Should correctly set default options on the adapter instance', async () => {
        const adapter = new TransactionalAdapterMongoose({
            mongooseConnectionToken: MONGOOSE_CONNECTION,
            defaultTxOptions: {
                readConcern: { level: 'snapshot' },
            },
        });

        expect(adapter.defaultTxOptions).toEqual({
            readConcern: { level: 'snapshot' },
        });
    });
});
