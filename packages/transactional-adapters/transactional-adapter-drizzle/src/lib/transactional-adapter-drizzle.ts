import { TransactionalAdapter } from "@nestjs-cls/transactional";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export interface DrizzleOrmTransactionalAdapterOptions {
    /**
     * The injection token for the Drizzle instance.
     */
    drizzleInstanceToken: any;

    /**
     * Default options for the transaction. These will be merged with any transaction-specific options
     * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
     */
    defaultTxOptions?: Partial<PgTransactionConfig>;
}

export class TransactionalAdapterDrizzleOrm
    implements
        TransactionalAdapter<
            PostgresJsDatabase<any>,
            PostgresJsDatabase<any>,
            PgTransactionConfig
        >
{
    connectionToken: any;

    defaultTxOptions?: Partial<PgTransactionConfig>;

    constructor(options: DrizzleOrmTransactionalAdapterOptions) {
        this.connectionToken = options.drizzleInstanceToken;
        this.defaultTxOptions = options.defaultTxOptions;
    }

    optionsFactory = (drizzleInstance: PostgresJsDatabase) => ({
        wrapWithTransaction: async (
            options: PgTransactionConfig,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: PostgresJsDatabase) => void
        ) => {
            return drizzleInstance.transaction(async (trx) => {
                setClient(trx);
                return fn();
            }, options);
        },
        getFallbackInstance: () => drizzleInstance
    });
}
