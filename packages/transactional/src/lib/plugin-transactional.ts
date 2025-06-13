import { Provider } from '@nestjs/common';
import { ClsPluginBase } from 'nestjs-cls';
import { getTransactionToken } from './inject-transaction.decorator';
import {
    MergedTransactionalAdapterOptions,
    OptionalLifecycleHooks,
    TransactionalAdapter,
    TransactionalPluginOptions,
} from './interfaces';
import {
    TRANSACTION_CONNECTION,
    TRANSACTIONAL_ADAPTER_OPTIONS,
} from './symbols';
import { getTransactionHostToken, TransactionHost } from './transaction-host';

export class ClsPluginTransactional extends ClsPluginBase {
    providers: Provider[];

    constructor(options: TransactionalPluginOptions<any, any, any>) {
        super(
            options.connectionName
                ? `cls-plugin-transactional-${options.connectionName}`
                : 'cls-plugin-transactional',
        );
        this.imports.push(...(options.imports ?? []));
        const transactionHostToken = getTransactionHostToken(
            options.connectionName,
        );
        this.providers = [
            {
                provide: TRANSACTION_CONNECTION,
                ...(options.adapter.connectionToken
                    ? { useExisting: options.adapter.connectionToken }
                    : { useValue: options.adapter.connection }),
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
                        ...this.bindLifecycleHooks(options),
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
            if (options.adapter.supportsTransactionProxy === false) {
                throw new TransactionProxyUnsupportedError(options.adapter);
            }
            const transactionProxyToken = getTransactionToken(
                options.connectionName,
            );
            this.providers.push({
                provide: transactionProxyToken,
                inject: [transactionHostToken],
                useFactory: (txHost: TransactionHost<unknown>) =>
                    new Proxy(txHost.tx, {
                        // Dynamically get the current tx instance at access time
                        get: (_, propName) => {
                            const tx = txHost.tx as any;
                            const prop = tx[propName];
                            if (typeof prop === 'function') {
                                return prop.bind(tx);
                            } else {
                                return prop;
                            }
                        },
                        apply: (_, __, args) => {
                            const tx = txHost.tx as any;
                            return tx.apply(tx, args);
                        },
                    }),
            });
            this.exports.push(transactionProxyToken);
        }
    }

    private bindLifecycleHooks(
        options: TransactionalPluginOptions<any, any, any>,
    ): OptionalLifecycleHooks {
        const {
            onModuleInit,
            onModuleDestroy,
            onApplicationBootstrap,
            beforeApplicationShutdown,
            onApplicationShutdown,
        } = options.adapter;
        return {
            onModuleInit: onModuleInit?.bind(options.adapter),
            onModuleDestroy: onModuleDestroy?.bind(options.adapter),
            onApplicationBootstrap: onApplicationBootstrap?.bind(
                options.adapter,
            ),
            beforeApplicationShutdown: beforeApplicationShutdown?.bind(
                options.adapter,
            ),
            onApplicationShutdown: onApplicationShutdown?.bind(options.adapter),
        };
    }
}

export class TransactionProxyUnsupportedError extends Error {
    constructor(adapter: TransactionalAdapter<any, any, any>) {
        super(
            `The adapter ${adapter.constructor.name} does not support the "Transaction Proxy" feature, please disable the "enableTransactionProxy" option.`,
        );
    }
}
