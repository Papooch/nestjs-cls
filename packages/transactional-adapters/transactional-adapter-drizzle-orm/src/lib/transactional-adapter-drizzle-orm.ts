import { TransactionalAdapter } from '@nestjs-cls/transactional';

type AnyDrizzleClient = {
    transaction: (
        fn: (tx: AnyDrizzleClient) => Promise<any>,
        options?: any,
    ) => Promise<any>;
};

type DrizzleTransactionOptions<T> = T extends AnyDrizzleClient
    ? Parameters<T['transaction']>[1]
    : never;

export interface DrizzleOrmTransactionalAdapterOptions<
    TClient extends AnyDrizzleClient,
> {
    /**
     * The injection token for the Drizzle instance.
     */
    drizzleInstanceToken: any;

    /**
     * Default options for the transaction. These will be merged with any transaction-specific options
     * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
     */
    defaultTxOptions?: Partial<DrizzleTransactionOptions<TClient>>;
}

export class TransactionalAdapterDrizzleOrm<
    TClient extends AnyDrizzleClient,
> implements TransactionalAdapter<
    TClient,
    TClient,
    DrizzleTransactionOptions<TClient>
> {
    connectionToken: any;

    defaultTxOptions?: Partial<DrizzleTransactionOptions<TClient>>;

    constructor(options: DrizzleOrmTransactionalAdapterOptions<TClient>) {
        this.connectionToken = options.drizzleInstanceToken;
        this.defaultTxOptions = options.defaultTxOptions;
    }

    optionsFactory = (drizzleInstance: TClient) => ({
        wrapWithTransaction: async (
            options: DrizzleTransactionOptions<TClient>,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: TClient) => void,
        ) => {
            return drizzleInstance.transaction(async (tx) => {
                setClient(tx as TClient);
                return fn();
            }, options);
        },
        wrapWithNestedTransaction: async (
            options: DrizzleTransactionOptions<TClient>,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: TClient) => void,
            client: TClient,
        ) => {
            return client.transaction(async (tx) => {
                setClient(tx as TClient);
                return fn();
            }, options);
        },
        getFallbackInstance: () => drizzleInstance,
    });
}
