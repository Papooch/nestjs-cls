import { TransactionalAdapter } from '@nestjs-cls/transactional';

import {
    ClientSession,
    ClientSessionOptions,
    MongoClient,
    TransactionOptions,
} from 'mongodb';

export type MongoDBTransactionOptions = TransactionOptions & {
    /**
     * Options for the encompassing `session` that hosts the transaction.
     */
    sessionOptions?: ClientSessionOptions;
};

export interface MongoDBTransactionalAdapterOptions {
    /**
     * The injection token for the MongoClient instance.
     */
    mongoClientToken: any;

    /**
     * Default options for the transaction. These will be merged with any transaction-specific options
     * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
     */
    defaultTxOptions?: Partial<MongoDBTransactionOptions>;
}

export class TransactionalAdapterMongoDB
    implements
        TransactionalAdapter<
            MongoClient,
            ClientSession,
            MongoDBTransactionOptions
        >
{
    connectionToken: any;

    defaultTxOptions?: Partial<TransactionOptions>;

    private fallbackSession: ClientSession | undefined;

    constructor(options: MongoDBTransactionalAdapterOptions) {
        this.connectionToken = options.mongoClientToken;
        this.defaultTxOptions = options.defaultTxOptions;
    }

    async onModuleDestroy() {
        await this.fallbackSession?.endSession({ force: true });
    }

    optionsFactory(mongoClient: MongoClient) {
        return {
            wrapWithTransaction: async (
                options: MongoDBTransactionOptions,
                fn: (...args: any[]) => Promise<any>,
                setTx: (tx?: ClientSession) => void,
            ) => {
                return mongoClient.withSession(
                    options.sessionOptions ?? {},
                    async (session) =>
                        session.withTransaction(() => {
                            setTx(session);
                            return fn();
                        }, options),
                );
            },
            getFallbackInstance: () => {
                if (!this.fallbackSession || this.fallbackSession.hasEnded) {
                    this.fallbackSession = mongoClient.startSession();
                }
                return this.fallbackSession;
            },
        };
    }
}
