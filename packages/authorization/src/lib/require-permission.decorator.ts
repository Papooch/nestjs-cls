import { copyMethodMetadata } from 'nestjs-cls';
import { AuthHost } from './auth-host';
import { RequirePermissionOptions } from './authorization.interfaces';

export function RequirePermission<TAuth = any>(
    predicate: (auth: TAuth) => boolean,
    options?: RequirePermissionOptions,
): MethodDecorator;

export function RequirePermission(
    permission: any,
    options?: RequirePermissionOptions,
): MethodDecorator;

export function RequirePermission<TAuth = any>(
    authName: string,
    predicate: (auth: TAuth) => boolean,
    options: RequirePermissionOptions,
): MethodDecorator;

export function RequirePermission(
    authName: string,
    permission: any,
    options: RequirePermissionOptions,
): MethodDecorator;

export function RequirePermission<TAuth = any>(
    firstParam: any,
    secondParam?: any,
    thirdParam?: any,
): MethodDecorator {
    let authName: string | undefined;
    let predicateOrPermission: ((auth: TAuth) => boolean) | any;
    let options: RequirePermissionOptions | undefined;

    if (arguments.length === 3) {
        authName = firstParam;
        predicateOrPermission = secondParam;
        options = thirdParam;
    } else {
        authName = undefined;
        predicateOrPermission = firstParam;
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
            apply: async function (_, outerThis, args: any[]) {
                const authHost = AuthHost.getInstance(authName);

                authHost.requirePermission(predicateOrPermission, options);

                return await original.call(outerThis, ...args);
            },
        });
        copyMethodMetadata(original, descriptor.value);
    }) as MethodDecorator;
}
