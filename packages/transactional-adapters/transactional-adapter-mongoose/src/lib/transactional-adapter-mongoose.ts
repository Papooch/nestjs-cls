import { TransactionalAdapter } from '@nestjs-cls/transactional';
import mongoose, { ClientSession, Connection } from 'mongoose';

type MongooseTransactionOptions = Parameters<Connection['transaction']>[1];

export interface MongoDBTransactionalAdapterOptions {
    /**
     * The injection token for the mongoose Connection instance.
     */
    mongooseConnectionToken: any;

    /**
     * Default options for the transaction. These will be merged with any transaction-specific options
     * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
     */
    defaultTxOptions?: Partial<MongooseTransactionOptions>;

    /**
     * Only supported for `mongoose >= 8.4`
     *
     * Whether to automatically enable the
     * [native AsyncLocalStorage integration](https://mongoosejs.com/docs/transactions.html#asynclocalstorage)
     * for transactions. This will set the `transactionAsyncLocalStorage` option to `true` in Mongoose.
     *
     * If enabled, there is no need to pass the  session (`tx`) of `TransactionHost` to queries.
     * All queries executed within a `TransactionalHost#withTransaction` or the `@Transactional` decorator
     * will be executed within the same transaction.
     */
    enableNativeAsyncLocalStorage?: boolean;
}

export class TransactionalAdapterMongoose
    implements
        TransactionalAdapter<
            Connection,
            ClientSession | null,
            MongooseTransactionOptions
        >
{
    connectionToken: any;

    defaultTxOptions?: Partial<MongooseTransactionOptions>;

    constructor(options: MongoDBTransactionalAdapterOptions) {
        this.connectionToken = options.mongooseConnectionToken;
        this.defaultTxOptions = options.defaultTxOptions;
        if (options.enableNativeAsyncLocalStorage) {
            mongoose.set('transactionAsyncLocalStorage', true);
        }
    }

    optionsFactory(connection: Connection) {
        return {
            wrapWithTransaction: async (
                options: MongooseTransactionOptions,
                fn: (...args: any[]) => Promise<any>,
                setTx: (tx?: ClientSession) => void,
            ) => {
                return connection.transaction((session) => {
                    setTx(session);
                    return fn();
                }, options);
            },
            getFallbackInstance: () => null,
        };
    }
}
