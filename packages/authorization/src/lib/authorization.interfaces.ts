export interface RequirePermissionOptions {
    exceptionMessage?: string;
}

export interface AuthHostOptions<TAuth = any> {
    exceptionFactory: (
        options: RequirePermissionOptions,
        value?: any,
    ) => Error | string;
    permissionResolutionStrategy: (authObject: TAuth, value: any) => boolean;
}
