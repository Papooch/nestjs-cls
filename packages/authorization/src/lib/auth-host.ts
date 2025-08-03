import { Inject, Logger } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import {
    AuthHostOptions,
    RequirePermissionOptions,
} from './authorization.interfaces';
import { AUTH_HOST_OPTIONS, getAuthClsKey } from './authorization.symbols';

export class AuthHost<TAuth = never> {
    private readonly cls = ClsServiceManager.getClsService();
    private readonly logger = new Logger(AuthHost.name);
    private readonly authInstanceSymbol: symbol;

    private static _instanceMap = new Map<symbol, AuthHost<any>>();

    static getInstance<TAuth = never>(authName?: string): AuthHost<TAuth> {
        const instanceSymbol = getAuthClsKey(authName);
        const instance = this._instanceMap.get(instanceSymbol);

        if (!instance) {
            throw new Error(
                'AuthHost not initialized, Make sure that the `ClsPluginAuth` is properly registered and that the correct `authName` is used.',
            );
        }
        return instance;
    }

    constructor(
        @Inject(AUTH_HOST_OPTIONS)
        private readonly options: AuthHostOptions<TAuth>,
    ) {
        this.authInstanceSymbol = getAuthClsKey();
        AuthHost._instanceMap.set(this.authInstanceSymbol, this);
    }

    get auth(): TAuth {
        if (!this.cls.isActive()) {
            throw new Error(
                'CLS context is not active, cannot retrieve auth instance.',
            );
        }
        return this.cls.get(this.authInstanceSymbol) as TAuth;
    }

    setAuth(auth: TAuth): void {
        this.cls.set(this.authInstanceSymbol, auth);
    }

    hasPermission(predicate: (auth: TAuth) => boolean): boolean;
    hasPermission(permission: any): boolean;
    hasPermission(
        predicateOrPermission: ((auth: TAuth) => boolean) | any,
    ): boolean {
        if (typeof predicateOrPermission === 'function') {
            return predicateOrPermission(this.auth);
        } else {
            return this.options.permissionResolutionStrategy(
                this.auth,
                predicateOrPermission,
            );
        }
    }

    requirePermission(
        permission: any,
        options?: RequirePermissionOptions,
    ): void;
    requirePermission(
        predicate: (auth: TAuth) => boolean,
        options?: RequirePermissionOptions,
    ): void;
    requirePermission(
        predicateOrPermission: ((auth: TAuth) => boolean) | any,
        options: RequirePermissionOptions = {},
    ): void {
        const value =
            typeof predicateOrPermission === 'function'
                ? undefined
                : predicateOrPermission;

        if (!this.hasPermission(predicateOrPermission)) {
            throw this.options.exceptionFactory(options, value);
        }
    }
}
