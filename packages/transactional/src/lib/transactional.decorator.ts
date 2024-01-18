import { Inject } from '@nestjs/common';
import { TransactionHost } from './transaction-host';

export function Transactional<TOptions>(options?: TOptions) {
    const injectTransactionHost = Inject(TransactionHost);
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<(...args: any) => Promise<any>>,
    ) => {
        console.log('target', target);
        if (!target.__transactionHost) {
            injectTransactionHost(target, '__transactionHost');
        }
        const original = descriptor.value;
        if (typeof original !== 'function') {
            throw new Error(
                `The @Transactional decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`,
            );
        }
        descriptor.value = function (...args: any[]) {
            if (!this.__transactionHost) {
                throw new Error(
                    `Failed to inject transaction host into ${target.constructor.name}`,
                );
            }
            return this.__transactionHost.startTransaction(
                options,
                original.bind(this, ...args),
            );
        };
        copyMetadata(original, descriptor.value);
    };
}

/**
 * Copies all metadata from one object to another.
 * Useful for overwriting function definition in
 * decorators while keeping all previously
 * attached metadata
 *
 * @param from object to copy metadata from
 * @param to object to copy metadata to
 */
function copyMetadata(from: any, to: any) {
    const metadataKeys = Reflect.getMetadataKeys(from);
    metadataKeys.map((key) => {
        const value = Reflect.getMetadata(key, from);
        Reflect.defineMetadata(key, value, to);
    });
}
