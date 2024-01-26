import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { Knex } from 'knex';

export interface KnexTransactionalAdapterOptions {
    /**
     * The injection token for the Knex instance.
     */
    knexInstanceToken: any;
}

export class TransactionalAdapterKnex
    implements TransactionalAdapter<Knex, Knex, Knex.TransactionConfig>
{
    connectionToken: any;

    constructor(options: KnexTransactionalAdapterOptions) {
        this.connectionToken = options.knexInstanceToken;
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
        getFallbackInstance: () => knexInstance,
    });
}
