import { Provider } from '@nestjs/common';
import { ClsModule, ClsPlugin } from 'nestjs-cls';
import { getTransactionToken } from './inject-transaction.decorator';
import {
    MergedTransactionalAdapterOptions,
    TransactionalPluginOptions,
} from './interfaces';
import {
    TRANSACTIONAL_ADAPTER_OPTIONS,
    TRANSACTION_CONNECTION,
} from './symbols';
import { getTransactionHostToken, TransactionHost } from './transaction-host';

export class ClsPluginTransactional implements ClsPlugin {
    name: string;
    providers: Provider[];
    imports: any[] = [];
    exports: any[] = [];

    constructor(options: TransactionalPluginOptions<any, any, any>) {
        this.name = options.connectionName
            ? `cls-plugin-transactional-${options.connectionName}`
            : 'cls-plugin-transactional';
        this.imports.push(...(options.imports ?? []));
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
                useFactory: (
                    connection: any,
                ): MergedTransactionalAdapterOptions<any, any> => {
                    const adapterOptions =
                        options.adapter.optionsFactory(connection);
                    return {
                        ...adapterOptions,
                        connectionName: options.connectionName,
                        enableTransactionProxy:
                            options.enableTransactionProxy ?? false,
                        defaultTxOptions:
                            options.adapter.defaultTxOptions ?? {},
                    };
                },
            },
            {
                provide: transactionHostToken,
                useClass: TransactionHost,
            },
        ];
        this.exports.push(transactionHostToken);

        if (options.enableTransactionProxy) {
            const transactionProxyToken = getTransactionToken(
                options.connectionName,
            );
            this.imports.push(
                ClsModule.forFeatureAsync({
                    provide: transactionProxyToken,
                    inject: [transactionHostToken],
                    useFactory: (txHost: TransactionHost) => txHost.tx,
                    type: 'function',
                    global: true,
                }),
            );
        }
    }
}
