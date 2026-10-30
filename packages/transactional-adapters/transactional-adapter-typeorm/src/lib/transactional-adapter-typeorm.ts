import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { DataSource, EntityManager } from 'typeorm';
import type { IsolationLevel } from 'typeorm/driver/types/IsolationLevel.js';
import type { ReplicationMode } from 'typeorm/driver/types/ReplicationMode.js';

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

    /**
     * Which replica to run the transaction against, using TypeORM's
     * {@link ReplicationMode}. Only has an effect when the `DataSource` is
     * configured with replication. Defaults to `'master'`.
     *
     * - `'master'` runs on the primary/write connection.
     * - `'slave'` runs on a read replica. Unlike TypeORM's default behaviour -
     *   which only routes plain `find`-style reads to a replica - this forces
     *   the whole transaction (including custom query-builder reads) onto the
     *   replica.
     *
     * Note: nested transactions are not supported in `'slave'` mode.
     */
    mode?: ReplicationMode;
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
            if (options?.mode === 'slave') {
                return this.wrapWithReplicaTransaction(
                    dataSource,
                    options,
                    fn,
                    setClient,
                );
            }
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
            if (options?.mode === 'slave') {
                throw new Error(
                    'Nested transactions are not supported in slave mode',
                );
            }
            return client.transaction(options?.isolationLevel, (trx) => {
                setClient(trx);
                return fn();
            });
        },
        getFallbackInstance: () => dataSource.manager,
    });

    /**
     * Runs a transaction on a replica (read) query runner so that every read in
     * the callback - including custom query-builder reads, which TypeORM would
     * otherwise send to the master - is routed to the replica.
     */
    private async wrapWithReplicaTransaction(
        dataSource: DataSource,
        options: TypeOrmTransactionOptions,
        fn: (...args: any[]) => Promise<any>,
        setClient: (client?: EntityManager) => void,
    ) {
        const queryRunner = dataSource.createQueryRunner('slave');
        await queryRunner.connect();
        await queryRunner.startTransaction(options?.isolationLevel);
        setClient(queryRunner.manager);
        try {
            const result = await fn();
            await queryRunner.commitTransaction();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
