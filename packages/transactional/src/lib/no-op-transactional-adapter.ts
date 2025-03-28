import { Logger } from '@nestjs/common';
import { TransactionalAdapter } from './interfaces';

export interface NoOpTransactionalAdapterOptions {
    /**
     * The value to use as the `tx` property in the adapter.
     */
    tx?: any;
    /**
     * The injection token for
     */
    txToken?: any;
    disableWarning?: boolean;
}

/**
 * A no-op transactional adapter that does not actually start a transaction.
 *
 * Useful for testing purposes or making sure that the TransactionHost is wired up correctly.
 */
export class NoOpTransactionalAdapter
    implements TransactionalAdapter<any, any, any>
{
    private readonly logger = new Logger(NoOpTransactionalAdapter.name);
    private disableWarning: boolean;

    connectionToken?: any;
    connection?: any;

    defaultTxOptions?: any;

    constructor(options: NoOpTransactionalAdapterOptions) {
        if (!options.tx && !options.txToken) {
            throw new Error('Either `tx` or `txToken` must be provided.');
        }
        if (options.tx && options.txToken) {
            throw new Error('Only one of `tx` or `txToken` must be provided.');
        }
        this.connection = options.tx;
        this.connectionToken = options.txToken;
        this.disableWarning = options.disableWarning ?? false;
    }

    optionsFactory = (connection: any) => {
        return {
            wrapWithTransaction: async (
                _options: any,
                fn: (...args: any[]) => Promise<any>,
                setTx: (client?: any) => void,
            ) => {
                if (!this.disableWarning) {
                    this.logger.warn(
                        'Transactions are disabled when using the no-op adapter. Make sure you only use it for testing purposes.',
                    );
                }
                setTx(connection);
                return fn();
            },
            getFallbackInstance: () => connection,
        };
    };
}
