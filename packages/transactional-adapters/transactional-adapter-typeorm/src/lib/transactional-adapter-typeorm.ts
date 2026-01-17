import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { DataSource, EntityManager } from 'typeorm';
import type { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export interface TypeOrmTransactionalAdapterOptions {
    /**
     * The injection token for the TypeORM DataSource instance.
     */
    dataSourceToken: any;

    /**
     * Default options for the transaction. These will be merged with any transaction-specific options
     * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
     */
    defaultTxOptions?: Partial<TypeOrmTransactionOptions>;
}

export interface TypeOrmTransactionOptions {
    isolationLevel: IsolationLevel;
}

export class TransactionalAdapterTypeOrm implements TransactionalAdapter<
    DataSource,
    EntityManager,
    TypeOrmTransactionOptions
> {
    connectionToken: any;

    defaultTxOptions?: Partial<TypeOrmTransactionOptions>;

    constructor(options: TypeOrmTransactionalAdapterOptions) {
        this.connectionToken = options.dataSourceToken;
        this.defaultTxOptions = options.defaultTxOptions;
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
        wrapWithNestedTransaction: async (
            options: TypeOrmTransactionOptions,
            fn: (...args: any[]) => Promise<any>,

            setClient: (client?: EntityManager) => void,
            client: EntityManager,
        ) => {
            return client.transaction(options?.isolationLevel, (trx) => {
                setClient(trx);
                return fn();
            });
        },
        getFallbackInstance: () => dataSource.manager,
    });
}
