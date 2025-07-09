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
            const savepointTx = await SavepointTransaction.initialize(client);

            try {
                setClient(savepointTx.client);

                return await savepointTx.runInSavePoint(fn);
            } catch (e) {
                await savepointTx.rollback();

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

class SavepointTransaction<DB> {
    private constructor(
        public readonly client: ControlledTransaction<DB, string[]>,
        private readonly savepointId: string,
    ) {}

    static async initialize<DB>(
        client: Kysely<DB>,
        savepointId: string = generateSavePointId(),
    ) {
        const trx = await (client as ControlledTransaction<DB, string[]>)
            .savepoint(savepointId)
            .execute();

        return new SavepointTransaction(trx, savepointId);
    }

    async runInSavePoint(fn: (...args: any[]) => Promise<any>) {
        const result = await fn();

        await this.client.releaseSavepoint(this.savepointId).execute();

        return result;
    }

    async rollback() {
        try {
            await this.client.rollbackToSavepoint(this.savepointId).execute();
        } catch (e) {
            // Maybe it is needed to operate something for driver which does not support save point
            throw e;
        }
    }
}
