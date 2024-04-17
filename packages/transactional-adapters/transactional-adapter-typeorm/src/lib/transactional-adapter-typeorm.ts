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
            DataSource | EntityManager,
            TypeOrmTransactionOptions
        >
{
    connectionToken: any;

    constructor(options: TypeOrmTransactionalAdapterOptions) {
        this.connectionToken = options.typeOrmInstanceToken;
    }

    optionsFactory = (typeORMInstance: DataSource) => ({
        wrapWithTransaction: async (
            options: TypeOrmTransactionOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: EntityManager) => void,
        ) => {
            return typeORMInstance.transaction(
                options?.isolationLevel,
                (trx) => {
                    setClient(trx);
                    return fn();
                },
            );
        },
        getFallbackInstance: () => typeORMInstance,
    });
}
