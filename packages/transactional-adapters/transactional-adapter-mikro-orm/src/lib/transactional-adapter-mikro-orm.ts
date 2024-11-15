import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { MikroORM, EntityManager, IsolationLevel, IDatabaseDriver, Connection } from '@mikro-orm/core';

export interface MikroOrmTransactionalAdapterOptions {
  /**
   * The injection token for the MikroORM instance.
   */
  dataSourceToken: any;

  /**
   * Default options for the transaction. These will be merged with any transaction-specific options
   * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
   */
  defaultTxOptions?: Partial<MikroOrmTransactionOptions>;
}

export interface MikroOrmTransactionOptions {
  isolationLevel?: IsolationLevel;
}

export class TransactionalAdapterMikroOrm
  implements
  TransactionalAdapter<
    MikroORM<IDatabaseDriver<Connection>>,
    EntityManager<IDatabaseDriver<Connection>>,
    MikroOrmTransactionOptions
  > {
  connectionToken: any;
  defaultTxOptions?: Partial<MikroOrmTransactionOptions>;

  constructor(options: MikroOrmTransactionalAdapterOptions) {
    this.connectionToken = options.dataSourceToken;
    this.defaultTxOptions = options.defaultTxOptions;
  }

  optionsFactory = (orm: MikroORM<IDatabaseDriver<Connection>>) => ({
    wrapWithTransaction: async (
      options: MikroOrmTransactionOptions,
      fn: (...args: any[]) => Promise<any>,
      setClient: (client?: EntityManager<IDatabaseDriver<Connection>>) => void,
    ) => {
      const em = orm.em.fork(); // Create a forked EntityManager for the transaction
      await em.begin({
        isolationLevel: options?.isolationLevel || this.defaultTxOptions?.isolationLevel,
      });
      try {
        setClient(em);
        const result = await fn();
        await em.commit();
        return result;
      } catch (error) {
        await em.rollback();
        throw error;
      }
    },
    getFallbackInstance: () => orm.em,
  });
}
