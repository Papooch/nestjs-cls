import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { getTransactionToken } from './inject-transaction.decorator';
import {
    TOptionsFromAdapter,
    MergedTransactionalAdapterOptions,
    TTxFromAdapter,
} from './interfaces';
import {
    Propagation,
    TransactionAlreadyActiveError,
    TransactionNotActiveError,
    TransactionPropagationError,
} from './propagation';
import { getTransactionClsKey, TRANSACTIONAL_ADAPTER_OPTIONS } from './symbols';

@Injectable()
export class TransactionHost<TAdapter = never> {
    private readonly cls = ClsServiceManager.getClsService();
    private readonly logger = new Logger(TransactionHost.name);
    private readonly transactionInstanceSymbol: symbol;

    private static readonly _instanceMap = new Map<symbol, TransactionHost>();

    /**
     * Get a singleton instance of the TransactionHost outside of DI.
     *
     * @param connectionName The name of the connection. If omitted, the default instance is used.
     */
    static getInstance<TAdapter = never>(
        connectionName?: string,
    ): TransactionHost<TAdapter> {
        const instanceSymbol = getTransactionClsKey(connectionName);
        const instance = this._instanceMap.get(instanceSymbol);
        if (!instance) {
            throw new Error(
                'TransactionHost not initialized, Make sure that the `ClsPluginTransactional` is properly registered and that the correct `connectionName` is used.',
            );
        }
        return instance;
    }

    constructor(
        @Inject(TRANSACTIONAL_ADAPTER_OPTIONS)
        private readonly _options: MergedTransactionalAdapterOptions<
            TTxFromAdapter<TAdapter>,
            TOptionsFromAdapter<TAdapter>
        >,
    ) {
        this.transactionInstanceSymbol = getTransactionClsKey(
            this._options.connectionName,
        );

        TransactionHost._instanceMap.set(this.transactionInstanceSymbol, this);
    }

    /**
     * The instance of the transaction object.
     *
     * Depending on the adapter, this may be a transaction reference, a database client, or something else.
     * The type is defined by the adapter.
     *
     * If no transaction is active, this will return the fallback (non-transactional) instance defined by the adapter.
     */
    get tx(): TTxFromAdapter<TAdapter> {
        if (!this.cls.isActive()) {
            return this._options.getFallbackInstance();
        }
        return (this.cls.get(this.transactionInstanceSymbol) ??
            this._options.getFallbackInstance()) as TTxFromAdapter<TAdapter>;
    }

    /**
     * Wrap a function call in a transaction defined by the adapter.
     *
     * The transaction instance will be accessible on the TransactionHost as `tx`.
     *
     * This is useful when you want to run a function in a transaction, but can't use the `@Transactional()` decorator.
     *
     * @param fn The function to run in a transaction.
     * @returns Whatever the passed function returns
     */
    withTransaction<R>(fn: (...args: any[]) => Promise<R>): Promise<R>;
    /**
     * Wrap a function call in a transaction defined by the adapter.
     *
     * The transaction instance will be accessible on the TransactionHost as `tx`.
     *
     * This is useful when you want to run a function in a transaction, but can't use the `@Transactional()` decorator.
     *
     * @param options Transaction options depending on the adapter.
     * @param fn The function to run in a transaction.
     * @returns Whatever the passed function returns
     */
    withTransaction<R>(
        options: TOptionsFromAdapter<TAdapter>,
        fn: (...args: any[]) => Promise<R>,
    ): Promise<R>;
    /**
     * Wrap a function call in a transaction defined by the adapter.
     *
     * The transaction instance will be accessible on the TransactionHost as `tx`.
     *
     * This is useful when you want to run a function in a transaction, but can't use the `@Transactional()` decorator.
     *
     * @param propagation The propagation mode to use, @see{Propagation}.
     * @param fn The function to run in a transaction.
     * @returns Whatever the passed function returns
     */
    withTransaction<R>(
        propagation: Propagation,
        fn: (...args: any[]) => Promise<R>,
    ): Promise<R>;
    /**
     * Wrap a function call in a transaction defined by the adapter.
     *
     * The transaction instance will be accessible on the TransactionHost as `tx`.
     *
     * This is useful when you want to run a function in a transaction, but can't use the `@Transactional()` decorator.
     *
     * @param propagation The propagation mode to use, @see{Propagation}.
     * @param options Transaction options depending on the adapter.
     * @param fn The function to run in a transaction.
     * @returns Whatever the passed function returns
     */
    withTransaction<R>(
        propagation: Propagation,
        options: TOptionsFromAdapter<TAdapter>,
        fn: (...args: any[]) => Promise<R>,
    ): Promise<R>;
    withTransaction<R>(
        firstParam: any,
        secondParam?: any,
        thirdParam?: (...args: any[]) => Promise<R>,
    ) {
        let propagation: string;
        let options: any;
        let fn: (...args: any[]) => Promise<R>;
        if (thirdParam) {
            propagation = firstParam;
            options = secondParam;
            fn = thirdParam;
        } else if (secondParam) {
            fn = secondParam;
            if (typeof firstParam === 'string') {
                propagation = firstParam;
            } else {
                options = firstParam;
            }
        } else {
            fn = firstParam;
        }
        propagation ??= Propagation.Required;
        options = { ...this._options.defaultTxOptions, ...options };
        return this.decidePropagationAndRun(propagation, options, fn);
    }

    private decidePropagationAndRun(
        propagation: string,
        options: any,
        fn: (...args: any[]) => Promise<any>,
    ) {
        const fnName = fn.name || 'anonymous';
        switch (propagation) {
            case Propagation.Required:
                if (this.isTransactionActive()) {
                    if (isNotEmpty(options)) {
                        this.logger.warn(
                            `Transaction options are ignored because a transaction is already active and the propagation mode is ${propagation} (for method ${fnName}).`,
                        );
                    }
                    return this.cls.run({ ifNested: 'inherit' }, fn);
                } else {
                    return this.runWithTransaction(options, fn);
                }
            case Propagation.RequiresNew:
                return this.runWithTransaction(options, fn);
            case Propagation.NotSupported:
                if (isNotEmpty(options)) {
                    this.logger.warn(
                        `Transaction options are ignored because the propagation mode is ${propagation} (for method ${fnName}).`,
                    );
                }
                return this.withoutTransaction(fn);
            case Propagation.Mandatory:
                if (!this.isTransactionActive()) {
                    throw new TransactionNotActiveError(fnName);
                }
                if (isNotEmpty(options)) {
                    this.logger.warn(
                        `Transaction options are ignored because the propagation mode is ${propagation} (for method ${fnName}).`,
                    );
                }
                return fn();
            case Propagation.Never:
                if (this.isTransactionActive()) {
                    throw new TransactionAlreadyActiveError(fnName);
                }
                return this.withoutTransaction(fn);
            case Propagation.Supports:
                if (this.isTransactionActive()) {
                    if (isNotEmpty(options)) {
                        this.logger.warn(
                            `Transaction options are ignored because the propagation mode is ${propagation} (for method ${fnName}).`,
                        );
                    }
                    return fn();
                }
                return this.withoutTransaction(fn);
            case Propagation.Nested:
                if (this.isTransactionActive()) {
                    return this.runInNestedTransaction(options, fn);
                } else {
                    return this.runWithTransaction(options, fn);
                }
            default:
                throw new TransactionPropagationError(
                    `Unknown propagation mode ${propagation}`,
                );
        }
    }

    private runWithTransaction(
        options: any,
        fn: (...args: any[]) => Promise<any>,
    ) {
        return this.cls.run({ ifNested: 'inherit' }, () =>
            this._options
                .wrapWithTransaction(options, fn, this.setTxInstance.bind(this))
                .finally(() => this.setTxInstance(undefined)),
        );
    }

    private runInNestedTransaction(
        options: any,
        fn: (...args: any[]) => Promise<any>,
    ) {
        return this.cls.run({ ifNested: 'inherit' }, () => {
            // only run with adapter which support nested transaction
            if (
                this._options.hasOwnProperty('wrapWithNestedTransaction') &&
                typeof this._options.wrapWithNestedTransaction === 'function'
            ) {
                return this._options
                    .wrapWithNestedTransaction(
                        options,
                        fn,
                        this.setTxInstance.bind(this),
                        this.tx,
                    )
                    .finally(() => this.setTxInstance(this.tx));
            }
            this.logger.warn(
                `Nested Propagation option is ignored because an adapter does not support nested transactions (for method ${fn.name}).`,
            );
            return this.runWithTransaction(options, fn);
        });
    }

    /**
     * Wrap a function call to run outside of a transaction.
     *
     * @param fn The function to run outside of a transaction.
     * @returns Whatever the passed function returns
     */
    withoutTransaction<R>(fn: (...args: any[]) => Promise<R>): Promise<R> {
        return this.cls.run({ ifNested: 'inherit' }, () => {
            this.setTxInstance(undefined);
            return fn().finally(() => this.setTxInstance(undefined));
        });
    }

    /**
     * @returns `true` if a transaction is currently active, `false` otherwise.
     */
    isTransactionActive() {
        if (!this.cls.isActive()) {
            return false;
        }
        return !!this.cls.get(this.transactionInstanceSymbol);
    }

    private setTxInstance(txInstance?: TTxFromAdapter<TAdapter>) {
        this.cls.set(this.transactionInstanceSymbol, txInstance);
        if (this._options.enableTransactionProxy) {
            this.cls.proxy.set(
                getTransactionToken(this._options.connectionName),
                txInstance,
            );
        }
    }
}

function isNotEmpty(obj: any) {
    return obj && Object.keys(obj).length > 0;
}

/**
 * Get the injection token for a TransactionHost for a named connection.
 * If name is omitted, the default instance is used.
 */
export function getTransactionHostToken(connectionName?: string) {
    return connectionName
        ? Symbol.for(`${TransactionHost.name}_${connectionName}`)
        : TransactionHost;
}

/**
 * Inject a TransactionHost for a named connection. Only needed if you want to inject a named instance.
 *
 * A shorthand for `Inject(getTransactionHostToken(connectionName))`
 */
export function InjectTransactionHost(connectionName?: string) {
    return Inject(getTransactionHostToken(connectionName));
}
