import { Inject } from '@nestjs/common';
import { copyMethodMetadata } from 'nestjs-cls';
import { TOptionsFromAdapter } from './interfaces';
import { TransactionHost } from './transaction-host';

export function Transactional<TAdapter>(
    options?: TOptionsFromAdapter<TAdapter>,
) {
    const injectTransactionHost = Inject(TransactionHost);
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<(...args: any) => Promise<any>>,
    ) => {
        if (!target.__transactionHost) {
            injectTransactionHost(target, '__transactionHost');
        }
        const original = descriptor.value;
        if (typeof original !== 'function') {
            throw new Error(
                `The @Transactional decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`,
            );
        }
        descriptor.value = function (
            this: { __transactionHost: TransactionHost },
            ...args: any[]
        ) {
            if (!this.__transactionHost) {
                throw new Error(
                    `Failed to inject transaction host into ${target.constructor.name}`,
                );
            }
            return this.__transactionHost.withTransaction(
                options as never,
                original.bind(this, ...args),
            );
        };
        copyMethodMetadata(original, descriptor.value);
    };
}
