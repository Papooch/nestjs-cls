import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export interface TypeOrmTransactionalAdapterOptions {
  /**
   * The injection token for the typeOrm instance.
   */
  typeOrmInstanceToken: any;
}

export interface TypeOrmTransactionOptions {
  isolationLevel: IsolationLevel;
}
