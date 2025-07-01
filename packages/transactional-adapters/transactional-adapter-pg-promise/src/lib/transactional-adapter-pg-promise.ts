import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { IDatabase } from 'pg-promise';

export type Database = IDatabase<unknown>;

type PgPromiseTxOptions = Parameters<Database['tx']>[0];

export interface PgPromiseTransactionalAdapterOptions {
    /**
     * The injection token for the pg-promise instance.
     */
    dbInstanceToken: any;

    /**
     * Default options for the transaction. These will be merged with any transaction-specific options
     * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
     */
    defaultTxOptions?: PgPromiseTxOptions;
}

export class TransactionalAdapterPgPromise
    implements TransactionalAdapter<Database, Database, PgPromiseTxOptions>
{
    connectionToken: any;

    defaultTxOptions?: Partial<PgPromiseTxOptions>;

    constructor(options: PgPromiseTransactionalAdapterOptions) {
        this.connectionToken = options.dbInstanceToken;
        this.defaultTxOptions = options.defaultTxOptions;
    }

    optionsFactory = (pgPromiseDbInstance: Database) => ({
        wrapWithTransaction: async (
            options: PgPromiseTxOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Database) => void,
        ) => {
            return pgPromiseDbInstance.tx(options, (tx) => {
                setClient(tx as unknown as Database);
                return fn();
            });
        },
        wrapWithNestedTransaction: async (
            options: PgPromiseTxOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Database) => void,
            client: Database,
        ) => {
            return client.tx(options, (tx) => {
                setClient(tx as unknown as Database);
                return fn();
            });
        },
        getFallbackInstance: () => pgPromiseDbInstance,
    });
}
