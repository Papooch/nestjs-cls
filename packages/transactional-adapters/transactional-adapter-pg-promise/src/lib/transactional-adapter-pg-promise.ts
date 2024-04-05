import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { IDatabase } from 'pg-promise';

export type Database = IDatabase<unknown>;

type TxOptions = Parameters<Database['tx']>[0];

export interface PgPromiseTransactionalAdapterOptions {
    /**
     * The injection token for the pg-promise instance.
     */
    dbInstanceToken: any;

    defaultTxOptions?: TxOptions;
}

export class TransactionalAdapterPgPromise
    implements TransactionalAdapter<Database, Database, any>
{
    connectionToken: any;

    defaultTxOptions?: TxOptions;

    constructor(options: PgPromiseTransactionalAdapterOptions) {
        this.connectionToken = options.dbInstanceToken;
        this.defaultTxOptions = options.defaultTxOptions;
    }

    optionsFactory = (pgPromiseDbInstance: Database) => ({
        wrapWithTransaction: async (
            options: TxOptions | null,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Database) => void,
        ) => {
            return pgPromiseDbInstance.tx(
                options ?? this.defaultTxOptions ?? {},
                (tx) => {
                    setClient(tx as unknown as Database);
                    return fn();
                },
            );
        },
        getFallbackInstance: () => pgPromiseDbInstance,
    });
}
