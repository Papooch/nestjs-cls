import { Logger } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { getAuthClsKey } from './auth.symbols';
import { PermissionDeniedException } from './permission-denied.exception';
import { RequirePermissionOptions } from './auth.interfaces';

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

    constructor() {
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

    hasPermission(predicate: (auth: TAuth) => boolean): boolean {
        if (!predicate(this.auth)) {
            return false;
        }
        return true;
    }

    requirePermission(
        predicate: (auth: TAuth) => boolean,
        options?: RequirePermissionOptions,
    ): void {
        if (!this.hasPermission(predicate)) {
            throw new PermissionDeniedException(
                options?.exceptionMessage ?? 'Permission denied',
            );
        }
    }
}
