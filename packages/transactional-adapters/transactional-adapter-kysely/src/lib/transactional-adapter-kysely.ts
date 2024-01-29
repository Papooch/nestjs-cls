import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { Kysely, TransactionBuilder } from 'kysely';

export interface KyselyTransactionalAdapterOptions {
    /**
     * The injection token for the Kysely instance.
     */
    kyselyInstanceToken: any;
}

export interface KyselyTransactionOptions {
    isolationLevel?: Parameters<
        TransactionBuilder<any>['setIsolationLevel']
    >[0];
}

export class TransactionalAdapterKysely<DB = any>
    implements TransactionalAdapter<Kysely<DB>, Kysely<DB>, any>
{
    connectionToken: any;

    constructor(options: KyselyTransactionalAdapterOptions) {
        this.connectionToken = options.kyselyInstanceToken;
    }

    optionsFactory = (kyselyDb: Kysely<DB>) => ({
        wrapWithTransaction: async (
            options: KyselyTransactionOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: Kysely<DB>) => void,
        ) => {
            const transaction = kyselyDb.transaction();
            if (options?.isolationLevel) {
                transaction.setIsolationLevel(options.isolationLevel);
            }
            return transaction.execute(async (trx) => {
                setClient(trx);
                return fn();
            });
        },
        getFallbackInstance: () => kyselyDb,
    });
}
