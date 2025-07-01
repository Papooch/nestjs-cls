import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { Knex } from 'knex';

export interface KnexTransactionalAdapterOptions {
    /**
     * The injection token for the Knex instance.
     */
    knexInstanceToken: any;

    /**
     * Default options for the transaction. These will be merged with any transaction-specific options
     * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
     */
    defaultTxOptions?: Partial<Knex.TransactionConfig>;
}

export class TransactionalAdapterKnex
    implements TransactionalAdapter<Knex, Knex, Knex.TransactionConfig>
{
    connectionToken: any;

    defaultTxOptions?: Partial<Knex.TransactionConfig>;

    constructor(options: KnexTransactionalAdapterOptions) {
        this.connectionToken = options.knexInstanceToken;
        this.defaultTxOptions = options.defaultTxOptions;
    }

    optionsFactory = (knexInstance: Knex) => ({
        wrapWithTransaction: async (
            options: Knex.TransactionConfig,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Knex) => void,
        ) => {
            return knexInstance.transaction((trx) => {
                setClient(trx);
                return fn();
            }, options);
        },
        wrapWithNestedTransaction: (
            options: Knex.TransactionConfig,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Knex) => void,
            client: Knex,
        ) => {
            return client.transaction(async (trx) => {
                setClient(trx);
                return fn();
            }, options);
        },
        getFallbackInstance: () => knexInstance,
    });
}
