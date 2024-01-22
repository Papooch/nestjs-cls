import { Inject, Injectable } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import {
    TTxFromAdapter,
    TOptionsFromAdapter,
    TransactionalAdapterOptions,
} from './interfaces';
import {
    TRANSACTIONAL_ADAPTER_OPTIONS,
    TRANSACTIONAL_INSTANCE,
} from './symbols';

@Injectable()
export class TransactionHost<TAdapter = never> {
    private cls = ClsServiceManager.getClsService();

    constructor(
        @Inject(TRANSACTIONAL_ADAPTER_OPTIONS)
        private _options: TransactionalAdapterOptions<
            TTxFromAdapter<TAdapter>,
            TOptionsFromAdapter<TAdapter>
        >,
    ) {}

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
        return (
            this.cls.get(TRANSACTIONAL_INSTANCE) ??
            this._options.getFallbackInstance()
        );
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
    withTransaction<R>(
        options: TOptionsFromAdapter<TAdapter>,
        fn: (...args: any[]) => Promise<R>,
    ): Promise<R>;
    withTransaction<R>(
        optionsOrFn: any,
        maybeFn?: (...args: any[]) => Promise<R>,
    ) {
        let options: any;
        let fn: (...args: any[]) => Promise<R>;
        if (maybeFn) {
            options = optionsOrFn;
            fn = maybeFn;
        } else {
            options = {};
            fn = optionsOrFn;
        }
        return this.cls.run({ ifNested: 'inherit' }, () =>
            this._options
                .wrapWithTransaction(options, fn, this.setTxInstance.bind(this))
                .finally(() => this.setTxInstance(undefined)),
        );
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
        return !!this.cls.get(TRANSACTIONAL_INSTANCE);
    }

    private setTxInstance(txInstance?: TTxFromAdapter<TAdapter>) {
        this.cls.set(TRANSACTIONAL_INSTANCE, txInstance);
    }
}
