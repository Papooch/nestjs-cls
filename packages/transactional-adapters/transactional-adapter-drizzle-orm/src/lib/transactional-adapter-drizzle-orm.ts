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

    /**
     * Whether the underlying Drizzle driver's `db.transaction(cb)` is
     * synchronous (`better-sqlite3`) or asynchronous (`libsql`,
     * `node-postgres`, `postgres-js`, `mysql2`). Defaults to `'async'`.
     *
     * In `'sync'` mode, the inner callback is invoked synchronously and the
     * resulting value is wrapped in `Promise.resolve(...)` to satisfy the
     * plugin's `wrapWithTransaction: Promise<T>` contract. The user-supplied
     * `@Transactional()` method must therefore be sync (no `await` inside) —
     * this is the same constraint that `better-sqlite3` imposes on its own
     * transaction callbacks.
     */
    transactionMode?: 'async' | 'sync';
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

    private readonly transactionMode: 'async' | 'sync';

    constructor(options: DrizzleOrmTransactionalAdapterOptions<TClient>) {
        this.connectionToken = options.drizzleInstanceToken;
        this.defaultTxOptions = options.defaultTxOptions;
        this.transactionMode = options.transactionMode ?? 'async';
    }

    optionsFactory = (drizzleInstance: TClient) => {
        const wrapSync = (
            transactionFn: (cb: any, options?: any) => any,
            options: DrizzleTransactionOptions<TClient>,
            fn: (...args: any[]) => any,
            setClient: (client?: TClient) => void,
        ) =>
            Promise.resolve(
                transactionFn((tx: TClient) => {
                    setClient(tx);
                    return fn();
                }, options),
            );

        return {
            wrapWithTransaction: async (
                options: DrizzleTransactionOptions<TClient>,
                fn: (...args: any[]) => Promise<any>,
                setClient: (client?: TClient) => void,
            ) => {
                if (this.transactionMode === 'sync') {
                    return wrapSync(
                        drizzleInstance.transaction.bind(drizzleInstance),
                        options,
                        fn,
                        setClient,
                    );
                }
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
                if (this.transactionMode === 'sync') {
                    return wrapSync(
                        client.transaction.bind(client),
                        options,
                        fn,
                        setClient,
                    );
                }
                return client.transaction(async (tx) => {
                    setClient(tx as TClient);
                    return fn();
                }, options);
            },
            getFallbackInstance: () => drizzleInstance,
        };
    };
}
