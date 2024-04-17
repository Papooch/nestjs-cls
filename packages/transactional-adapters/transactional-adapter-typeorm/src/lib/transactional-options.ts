import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export interface TypeOrmTransactionalAdapterOptions {
    /**
     * The injection token for the typeOrm instance.
     */
    dataSourceToken: any;
}

export interface TypeOrmTransactionOptions {
    isolationLevel: IsolationLevel;
}
