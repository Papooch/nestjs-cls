import { Provider } from '@nestjs/common';
import { ClsPlugin } from 'nestjs-cls';
import { TransactionalPluginOptions } from './interfaces';
import {
    TRANSACTIONAL_ADAPTER_OPTIONS,
    TRANSACTION_CONNECTION,
} from './symbols';
import { TransactionHost } from './transaction-host';

export class ClsPluginTransactional implements ClsPlugin {
    name: 'cls-plugin-transactional';
    providers: Provider[];
    imports?: any[];

    constructor(options: TransactionalPluginOptions<any, any, any>) {
        this.imports = options.imports;
        this.providers = [
            TransactionHost,
            {
                provide: TRANSACTION_CONNECTION,
                useExisting: options.adapter.connectionToken,
            },
            {
                provide: TRANSACTIONAL_ADAPTER_OPTIONS,
                inject: [TRANSACTION_CONNECTION],
                useFactory: options.adapter.optionsFactory,
            },
        ];
    }
}
