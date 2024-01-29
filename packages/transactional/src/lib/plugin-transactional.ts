import { Provider } from '@nestjs/common';
import { ClsPlugin } from 'nestjs-cls';
import { TransactionalPluginOptions } from './interfaces';
import {
    TRANSACTIONAL_ADAPTER_OPTIONS,
    TRANSACTION_CONNECTION,
} from './symbols';
import { getTransactionHostToken, TransactionHost } from './transaction-host';

export class ClsPluginTransactional implements ClsPlugin {
    name: string;
    providers: Provider[];
    imports?: any[];
    exports?: any[];

    constructor(options: TransactionalPluginOptions<any, any, any>) {
        this.name = options.connectionName
            ? `cls-plugin-transactional-${options.connectionName}`
            : 'cls-plugin-transactional';
        this.imports = options.imports;
        const transactionHostToken = getTransactionHostToken(
            options.connectionName,
        );
        this.providers = [
            {
                provide: TRANSACTION_CONNECTION,
                useExisting: options.adapter.connectionToken,
            },
            {
                provide: TRANSACTIONAL_ADAPTER_OPTIONS,
                inject: [TRANSACTION_CONNECTION],
                useFactory: options.adapter.optionsFactory,
            },
            {
                provide: transactionHostToken,
                useClass: TransactionHost,
            },
        ];
        this.exports = [transactionHostToken];
    }
}
