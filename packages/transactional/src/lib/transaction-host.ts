import { Inject, Injectable } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import {
    TClientFromAdapter,
    TOptionsFromAdapter,
    TransactionalAdapterOptions,
} from './interfaces';
import { TRANSACTIONAL_OPTIONS, TRANSACTIONAL_CLIENT } from './symbols';

@Injectable()
export class TransactionHost<TAdapter = never> {
    private cls = ClsServiceManager.getClsService();

    constructor(
        @Inject(TRANSACTIONAL_OPTIONS)
        private _options: TransactionalAdapterOptions<
            TClientFromAdapter<TAdapter>,
            TOptionsFromAdapter<TAdapter>
        >,
    ) {}

    get client(): TClientFromAdapter<TAdapter> {
        if (!this.cls.isActive()) {
            return this._options.getClient();
        }
        return this.cls.get(TRANSACTIONAL_CLIENT) ?? this._options.getClient();
    }

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
            this._options.startTransaction(
                options,
                fn,
                this.setClient.bind(this),
            ),
        );
    }

    private setClient(client?: TClientFromAdapter<TAdapter>) {
        this.cls.set(TRANSACTIONAL_CLIENT, client);
    }
}
