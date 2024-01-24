import { Inject } from '@nestjs/common';
import { copyMethodMetadata } from 'nestjs-cls';
import { TOptionsFromAdapter } from './interfaces';
import { Propagation } from './propagation';
import { TransactionHost } from './transaction-host';

/**
 * Run the decorated method in a transaction.
 *
 * @param options Transaction options depending on the adapter.
 */
export function Transactional<TAdapter>(
    options?: TOptionsFromAdapter<TAdapter>,
): MethodDecorator;
/**
 * Run the decorated method in a transaction.
 *
 * @param propagation The propagation mode to use, @see{Propagation}.
 * @param options Transaction options depending on the adapter.
 */
export function Transactional<TAdapter>(
    propagation: Propagation,
    options?: TOptionsFromAdapter<TAdapter>,
): MethodDecorator;

export function Transactional(
    optionsOrPropagation?: any,
    maybeOptions?: any,
): MethodDecorator {
    let options: any;
    let propagation: Propagation | undefined;
    if (maybeOptions) {
        options = maybeOptions;
        propagation = optionsOrPropagation;
    } else if (typeof optionsOrPropagation === 'string') {
        propagation = optionsOrPropagation as Propagation;
    } else {
        options = optionsOrPropagation;
    }
    const injectTransactionHost = Inject(TransactionHost);
    return ((
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
                propagation as Propagation,
                options as never,
                original.bind(this, ...args),
            );
        };
        copyMethodMetadata(original, descriptor.value);
    }) as MethodDecorator;
}
