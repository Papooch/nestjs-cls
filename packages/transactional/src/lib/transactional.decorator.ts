/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject } from '@nestjs/common';
import { copyMethodMetadata } from 'nestjs-cls';
import { TOptionsFromAdapter } from './interfaces';
import { Propagation } from './propagation';
import { getTransactionHostToken, TransactionHost } from './transaction-host';

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
 */
export function Transactional<TAdapter>(
    propagation?: Propagation,
): MethodDecorator;

/**
 * Run the decorated method in a transaction.
 *
 * @param connectionName The name of the connection to use.
 */
export function Transactional<TAdapter>(
    connectionName?: string,
): MethodDecorator;

/**
 * Run the decorated method in a transaction.
 *
 * @param connectionName The name of the connection to use.
 * @param options Transaction options depending on the adapter.
 */
export function Transactional<TAdapter>(
    connectionName: string,
    options?: TOptionsFromAdapter<TAdapter>,
): MethodDecorator;

/**
 * Run the decorated method in a transaction.
 *
 * @param connectionName The name of the connection to use.
 * @param propagation The propagation mode to use, @see{Propagation}.
 */
export function Transactional<TAdapter>(
    connectionName: string,
    propagation?: Propagation,
): MethodDecorator;

/**
 * Run the decorated method in a transaction.
 *
 * @param propagation The propagation mode to use, @see{Propagation}.
 * @param options Transaction options depending on the adapter.
 */
export function Transactional<TAdapter>(
    connectionName: string,
    propagation: Propagation,
    options?: TOptionsFromAdapter<TAdapter>,
): MethodDecorator;

export function Transactional(
    firstParam?: any,
    secondParam?: any,
    thirdParam?: any,
): MethodDecorator {
    let connectionName: string | undefined;
    let options: any;
    let propagation: Propagation | undefined;
    if (thirdParam) {
        connectionName = firstParam;
        propagation = secondParam;
        options = thirdParam;
    } else if (secondParam) {
        if (paramIsPropagationMode(firstParam)) {
            propagation = firstParam;
        } else {
            connectionName = firstParam;
        }
        options = secondParam;
    } else {
        if (paramIsPropagationMode(firstParam)) {
            propagation = firstParam;
        } else if (typeof firstParam === 'string') {
            connectionName = firstParam;
        } else {
            options = firstParam;
        }
    }
    const transactionHostProperty =
        getTransactionHostPropertyName(connectionName);
    const injectTransactionHost = Inject(
        getTransactionHostToken(connectionName),
    );
    return ((
        target: any,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<(...args: any) => Promise<any>>,
    ) => {
        if (!target[transactionHostProperty]) {
            injectTransactionHost(target, transactionHostProperty);
        }
        const original = descriptor.value;
        if (typeof original !== 'function') {
            throw new Error(
                `The @Transactional decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`,
            );
        }
        descriptor.value = new Proxy(original, {
            apply: function (_, outerThis, args: any[]) {
                if (!outerThis[transactionHostProperty]) {
                    throw new Error(
                        `Failed to inject transaction host into ${target.constructor.name}`,
                    );
                }
                return (
                    outerThis[transactionHostProperty] as TransactionHost
                ).withTransaction(
                    propagation as Propagation,
                    options as never,
                    original.bind(outerThis, ...args),
                );
            },
        });
        copyMethodMetadata(original, descriptor.value);
    }) as MethodDecorator;
}

function getTransactionHostPropertyName(connectionName?: string) {
    return `__transactionHost${connectionName ? `_${connectionName}` : ''}`;
}

function paramIsPropagationMode(param: any): param is Propagation {
    return (
        typeof param === 'string' &&
        Object.values(Propagation).includes(param as Propagation)
    );
}
