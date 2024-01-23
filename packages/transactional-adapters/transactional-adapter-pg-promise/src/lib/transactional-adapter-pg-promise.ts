import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { IDatabase } from 'pg-promise';

export type Database = IDatabase<unknown>;

type TxOptions = Parameters<Database['tx']>[0];

export interface PgPromiseTransactionalAdapterOptions {
    /**
     * The injection token for the pg-promise instance.
     */
    dbInstanceToken: any;
}

export class TransactionalAdapterPgPromise
    implements TransactionalAdapter<Database, Database, any>
{
    connectionToken: any;

    constructor(options: PgPromiseTransactionalAdapterOptions) {
        this.connectionToken = options.dbInstanceToken;
    }

    optionsFactory = (pgPromiseDbInstance: Database) => ({
        wrapWithTransaction: async (
            options: TxOptions | null,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Database) => void,
        ) => {
            return pgPromiseDbInstance.tx(options ?? {}, (tx) => {
                setClient(tx as unknown as Database);
                return fn();
            });
        },
        getFallbackInstance: () => pgPromiseDbInstance,
    });
}
