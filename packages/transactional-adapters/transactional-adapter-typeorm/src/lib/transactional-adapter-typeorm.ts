import { DataSource, EntityManager } from 'typeorm';
import {
    TypeOrmTransactionOptions,
    TypeOrmTransactionalAdapterOptions,
} from './transactional-options';
import { TransactionalAdapter } from '@nestjs-cls/transactional';

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
