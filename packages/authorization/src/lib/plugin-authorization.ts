import { ClsPluginBase, ClsService } from 'nestjs-cls';
import { AuthHost } from './auth-host';
import { AUTH_HOST_OPTIONS, getAuthClsKey } from './authorization.symbols';
import {
    AuthHostOptions,
    RequirePermissionOptions,
} from './authorization.interfaces';
//import { UnauthorizedException } from '@nestjs/common';

const CLS_AUTHORIZATION_OPTIONS = Symbol('CLS_AUTHORIZATION_OPTIONS');

interface ClsAuthCallbacks<T> {
    authObjectFactory: (cls: ClsService) => T;
    permissionResolutionStrategy: (authObject: T, value: any) => boolean;
    exceptionFactory?: (
        options: RequirePermissionOptions,
        value?: any,
    ) => Error | string;
}

export interface ClsPluginAuthorizationOptions<T> {
    imports?: any[];
    inject?: any[];
    useFactory?: (...args: any[]) => ClsAuthCallbacks<T>;
}

export class ClsPluginAuthorization extends ClsPluginBase {
    constructor(options: ClsPluginAuthorizationOptions<any>) {
        super('cls-plugin-authorization');
        this.imports.push(...(options.imports ?? []));
        this.providers = [
            {
                provide: CLS_AUTHORIZATION_OPTIONS,
                inject: options.inject,
                useFactory: options.useFactory ?? (() => ({})),
            },
            {
                provide: AUTH_HOST_OPTIONS,
                inject: [CLS_AUTHORIZATION_OPTIONS],
                useFactory: (callbacks: ClsAuthCallbacks<any>) =>
                    ({
                        permissionResolutionStrategy:
                            callbacks.permissionResolutionStrategy,
                        exceptionFactory: (
                            options: RequirePermissionOptions,
                            value?: any,
                        ) => {
                            const factory =
                                callbacks.exceptionFactory ??
                                this.defaultExceptionFactory;

                            const exception = factory(options, value);
                            if (typeof exception === 'string') {
                                return new Error(exception);
                            }
                            return exception;
                        },
                    }) satisfies AuthHostOptions,
            },
            {
                provide: AuthHost,
                useClass: AuthHost,
            },
        ];

        this.registerHooks({
            inject: [CLS_AUTHORIZATION_OPTIONS],
            useFactory: (options: ClsAuthCallbacks<any>) => ({
                afterSetup: (cls: ClsService) => {
                    const authObject = options.authObjectFactory(cls);
                    cls.setIfUndefined(getAuthClsKey(), authObject);
                },
            }),
        });

        this.exports = [AuthHost];
    }

    private defaultExceptionFactory(
        options: RequirePermissionOptions,
        value?: any,
    ): Error | string {
        let message = options.exceptionMessage ?? 'Permission denied';
        if (value !== undefined) {
            message += ` (${JSON.stringify(value)})`;
        }
        return message;
    }
}
