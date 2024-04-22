import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { DataSource, EntityManager } from 'typeorm';
import type { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export interface TypeOrmTransactionalAdapterOptions {
    /**
     * The injection token for the TypeORM DataSource instance.
     */
    dataSourceToken: any;
}

export interface TypeOrmTransactionOptions {
    isolationLevel: IsolationLevel;
}

export class TransactionalAdapterTypeOrm
    implements
        TransactionalAdapter<
            DataSource,
            EntityManager,
            TypeOrmTransactionOptions
        >
{
    connectionToken: any;

    constructor(options: TypeOrmTransactionalAdapterOptions) {
        this.connectionToken = options.dataSourceToken;
    }

    optionsFactory = (dataSource: DataSource) => ({
        wrapWithTransaction: async (
            options: TypeOrmTransactionOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: EntityManager) => void,
        ) => {
            return dataSource.transaction(options?.isolationLevel, (trx) => {
                setClient(trx);
                return fn();
            });
        },
        getFallbackInstance: () => dataSource.manager,
    });
}
