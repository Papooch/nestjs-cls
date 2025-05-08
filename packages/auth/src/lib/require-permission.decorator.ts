import { copyMethodMetadata } from 'nestjs-cls';
import { AuthHost } from './auth-host';
import { RequirePermissionOptions } from './auth.interfaces';

export function RequirePermission<TAuth = any>(
    predicate: (auth: TAuth) => boolean,
    options?: RequirePermissionOptions,
): MethodDecorator;

export function RequirePermission<TAuth = any>(
    authName: string,
    predicate: (auth: TAuth) => boolean,
    options?: RequirePermissionOptions,
): MethodDecorator;

export function RequirePermission<TAuth = any>(
    firstParam: any,
    secondParam?: any,
    thirdParam?: any,
): MethodDecorator {
    let authName: string | undefined;
    let predicate: (auth: TAuth) => boolean;
    let options: RequirePermissionOptions | undefined;

    if (typeof firstParam === 'string') {
        authName = firstParam;
        predicate = secondParam as (auth: TAuth) => boolean;
        options = thirdParam;
    } else {
        authName = undefined;
        predicate = firstParam as (auth: TAuth) => boolean;
        options = secondParam;
    }
    options ??= {
        exceptionMessage: 'Permission denied',
    };

    return ((
        _target: any,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<(...args: any) => any>,
    ) => {
        const original = descriptor.value;
        if (typeof original !== 'function') {
            throw new Error(
                `The @RequirePermission decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`,
            );
        }
        descriptor.value = new Proxy(original, {
            apply: function (_, outerThis, args: any[]) {
                const authHost = AuthHost.getInstance(authName);

                authHost.requirePermission(predicate, options);

                return original.call(outerThis, ...args);
            },
        });
        copyMethodMetadata(original, descriptor.value);
    }) as MethodDecorator;
}
