import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { randomUUID } from 'crypto';
import { ControlledTransaction, Kysely, TransactionBuilder } from 'kysely';

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

export class TransactionalAdapterKysely<
    DB = any,
> implements TransactionalAdapter<
    Kysely<DB>,
    Kysely<DB>,
    KyselyTransactionOptions
> {
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

            // Note: We can't use callback-style syntax, because it does not expose savepoint functionality
            // which we need for nested transactions.
            const tx = await transaction.execute();

            try {
                setClient(tx);
                const result = await fn();
                await tx.commit().execute();
                return result;
            } catch (e) {
                await tx.rollback().execute();
                throw e;
            }
        },
        wrapWithNestedTransaction: async (
            _options: KyselyTransactionOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Kysely<DB>) => void,
            client: Kysely<DB>,
        ) => {
            const savepointId = generateSavePointId();
            const savepointTx = await (client as ControlledTransaction<DB>)
                .savepoint(savepointId)
                .execute();

            try {
                setClient(savepointTx);
                const result = await fn();
                // Attempt to release the savepoint.
                // If the driver does not support savepoint release, the only way to detect it is to match the error message.
                // See: https://github.com/kysely-org/kysely/issues/1497
                try {
                    await savepointTx.releaseSavepoint(savepointId).execute();
                } catch (e) {
                    if ((e as Error).message?.includes('releaseSavepoint')) {
                        return result;
                    } else {
                        throw e;
                    }
                }
                return result;
            } catch (e) {
                await savepointTx.rollbackToSavepoint(savepointId).execute();
                throw e;
            }
        },
        getFallbackInstance: () => kyselyDb,
    });
}

const generateSavePointId = () =>
    `savepoint_${randomUUID().replace(/-/g, '_')}`;
