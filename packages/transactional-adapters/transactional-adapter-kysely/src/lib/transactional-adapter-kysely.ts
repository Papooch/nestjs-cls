import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { Kysely, TransactionBuilder } from 'kysely';
import { EntityManager } from 'typeorm';

export interface KyselyTransactionalAdapterOptions {
    /**
     * The injection token for the Kysely instance.
     */
    kyselyInstanceToken: any;

    /**
     * Default options for the transaction. These will be merged with any transaction-specific options
     * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
     */
    defaultTxOptions?: Partial<KyselyTransactionOptions>;
}

export interface KyselyTransactionOptions {
    isolationLevel?: Parameters<
        TransactionBuilder<any>['setIsolationLevel']
    >[0];
    accessMode?: Parameters<TransactionBuilder<any>['setAccessMode']>[0];
}

export class TransactionalAdapterKysely<DB = any>
    implements
        TransactionalAdapter<Kysely<DB>, Kysely<DB>, KyselyTransactionOptions>
{
    connectionToken: any;

    defaultTxOptions?: Partial<KyselyTransactionOptions>;

    constructor(options: KyselyTransactionalAdapterOptions) {
        this.connectionToken = options.kyselyInstanceToken;
        this.defaultTxOptions = options.defaultTxOptions;
    }

    optionsFactory = (kyselyDb: Kysely<DB>) => ({
        wrapWithTransaction: async (
            options: KyselyTransactionOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Kysely<DB>) => void,
        ) => {
            let transaction = kyselyDb.startTransaction();

            if (options?.isolationLevel) {
                transaction = transaction.setIsolationLevel(
                    options.isolationLevel,
                );
            }

            if (options?.accessMode) {
                transaction = transaction.setAccessMode(options.accessMode);
            }

            const trx = await transaction.execute();
            try {
                setClient(trx);

                const result = await fn();

                await trx.commit().execute();

                return result;
            } catch (e) {
                await trx.rollback().execute();
                throw e;
            }
        },

        getFallbackInstance: () => kyselyDb,
    });
}
