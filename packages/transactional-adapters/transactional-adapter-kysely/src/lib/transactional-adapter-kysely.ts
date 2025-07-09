import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { ControlledTransaction, Kysely, TransactionBuilder } from 'kysely';
import { randomUUID } from 'crypto';

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
            const trx = await txBuilder(kyselyDb, options);
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
        wrapWithNestedTransaction: async (
            options: KyselyTransactionOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Kysely<DB>) => void,
            client: Kysely<DB>,
        ) => {
            const { savepoint, trx } = await nestedTxBuilder(client);
            try {
                setClient(trx);
                const result = await fn();

                await trx.releaseSavepoint(savepoint).execute();

                if (trx?.['isCommitable']) {
                    await trx.commit().execute();
                }
                return result;
            } catch (e) {
                await trx.rollbackToSavepoint(savepoint).execute();
                if (trx?.['isCommitable']) {
                    await trx.rollback().execute();
                }
                throw e;
            }
        },
        getFallbackInstance: () => kyselyDb,
    });
}

const generateSavePointId = () =>
    `savepoint_${randomUUID().replace(/-/g, '_')}`;

const txBuilder = async <DB>(
    client: Kysely<DB>,
    options: KyselyTransactionOptions,
) => {
    let transaction = client.startTransaction();

    if (options?.isolationLevel) {
        transaction = transaction.setIsolationLevel(options.isolationLevel);
    }

    if (options?.accessMode) {
        transaction = transaction.setAccessMode(options.accessMode);
    }

    return transaction.execute();
};
