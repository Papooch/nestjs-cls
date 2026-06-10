import { TransactionalAdapter } from '@nestjs-cls/transactional';

type AnyDrizzleClient = {
    transaction: (fn: (tx: AnyDrizzleClient) => any, options?: any) => any;
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
     * synchronous or asynchronous.
     *
     * - `'auto'` (default): detected from the Drizzle instance's internal
     *   `resultKind` field. Drizzle sets `resultKind: 'sync'` on drivers whose
     *   transaction callback is synchronous (`better-sqlite3`, `bun-sqlite`,
     *   `expo-sqlite`, `sql-js`, `durable-sqlite`). All other drivers
     *   (`libsql`, `node-postgres`, `postgres-js`, `mysql2`, `d1`, `op-sqlite`,
     *   ...) resolve to async.
     * - `'sync'`: force sync mode. Useful if auto-detection ever fails (e.g.
     *   Drizzle renames the internal field, or a third-party driver opts into
     *   sync semantics without exposing `resultKind`).
     * - `'async'`: force async mode (the original behavior).
     *
     * In sync mode, the inner transaction callback runs synchronously and the
     * result is wrapped in `Promise.resolve(...)`. The user-supplied
     * `@Transactional()` method must therefore be sync (no `await` inside) —
     * the same constraint sync Drizzle drivers impose on their own transaction
     * callbacks.
     */
    transactionMode?: 'auto' | 'sync' | 'async';
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

    private readonly transactionMode: 'auto' | 'sync' | 'async';

    constructor(options: DrizzleOrmTransactionalAdapterOptions<TClient>) {
        this.connectionToken = options.drizzleInstanceToken;
        this.defaultTxOptions = options.defaultTxOptions;
        this.transactionMode = options.transactionMode ?? 'auto';
    }

    optionsFactory = (drizzleInstance: TClient) => {
        const effectiveMode: 'sync' | 'async' =
            this.transactionMode === 'auto'
                ? (drizzleInstance as { resultKind?: unknown }).resultKind ===
                  'sync'
                    ? 'sync'
                    : 'async'
                : this.transactionMode;

        type RunTx = (
            client: TClient,
            options: DrizzleTransactionOptions<TClient>,
            fn: (...args: any[]) => any,
            setClient: (client?: TClient) => void,
        ) => Promise<any>;

        const syncRunTx: RunTx = (client, options, fn, setClient) => {
            // Sync drivers (better-sqlite3 et al.) throw synchronously on
            // rollback; convert to a rejected Promise to satisfy the
            // wrapWithTransaction: Promise<T> contract.
            try {
                return Promise.resolve(
                    client.transaction((tx) => {
                        setClient(tx as TClient);
                        return fn();
                    }, options),
                );
            } catch (err) {
                return Promise.reject(err);
            }
        };

        const asyncRunTx: RunTx = (client, options, fn, setClient) =>
            client.transaction(async (tx) => {
                setClient(tx as TClient);
                return fn();
            }, options);

        const effectiveRunTx: RunTx =
            effectiveMode === 'sync' ? syncRunTx : asyncRunTx;

        return {
            wrapWithTransaction: (
                options: DrizzleTransactionOptions<TClient>,
                fn: (...args: any[]) => Promise<any>,
                setClient: (client?: TClient) => void,
            ) => effectiveRunTx(drizzleInstance, options, fn, setClient),
            wrapWithNestedTransaction: (
                options: DrizzleTransactionOptions<TClient>,
                fn: (...args: any[]) => Promise<any>,
                setClient: (client?: TClient) => void,
                client: TClient,
            ) => effectiveRunTx(client, options, fn, setClient),
            getFallbackInstance: () => drizzleInstance,
        };
    };
}
