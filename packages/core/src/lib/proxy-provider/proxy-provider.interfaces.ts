import { Provider, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

interface ClsModuleProxyProviderCommonOptions {
    /**
     * Optional list of imported modules that export the providers which are required for the provider.
     */
    imports?: any[];

    /**
     * Optional list of additional providers that should be available to the Proxy.
     * Useful for passing configuration from a parent dynamic module.
     */
    extraProviders?: Provider[];

    /**
     * Whether to make this proxy provider available globally or just in this module.
     */
    global?: boolean;
}

export interface ClsModuleProxyClassProviderOptions
    extends ClsModuleProxyProviderCommonOptions {
    /**
     * Custom injection token to use for the provider. In case of a class provider,
     * this parameter is optional, as the class reference passed to `useClass` will
     * be used by default.
     */
    provide?: any;

    /**
     * The target class that will be used by this Proxy Provider. Make sure it is decorated with `@InjectableProxy`.
     */
    useClass: Type;

    /**
     * If true, accessing any property on this provider while it is unresolved will throw an exception.
     *
     * Otherwise, the application behaves as if accessing a property on an empty object.
     *
     * Default: false
     */
    strict?: boolean;

    type?: never;
}
export interface ClsModuleProxyFactoryProviderOptions
    extends ClsModuleProxyProviderCommonOptions {
    /**
     * Custom injection token to use for the provider. In case of a class provider,
     * this parameter is optional, as the class reference passed to `useClass` will
     * be used by default.
     */
    provide: any;

    /**
     * An array of injection tokens for providers used in the `useFactory`.
     */
    inject?: any[];

    /**
     * Factory function that accepts an array of providers in the order of the according tokens in the `inject` array.
     * Returns (or resolves with) an object (or a function) that will be used by this Proxy Provider.
     */
    useFactory: (...args: any[]) => any;

    /**
     * If true, accessing any property on this provider while it is unresolved will throw an exception.
     *
     * Otherwise, the application behaves as if accessing a property on an empty object.
     *
     * Default: false
     */
    strict?: boolean;

    /**
     * Explicit type of the value returned by the `useFactory` function. This is required to construct the base value of the Proxy
     * when the `useFactory` function returns a non-object value
     *
     * Default: 'object'
     */
    type?: ClsProxyFactoryReturnType;
}

export type ClsProxyFactoryReturnType = 'object' | 'function';

export type ClsModuleProxyProviderOptions =
    | ClsModuleProxyClassProviderOptions
    | ClsModuleProxyFactoryProviderOptions;

export interface ProxyClassProvider {
    token?: any;
    moduleRef: ModuleRef;
    useClass: Type;
}

export interface ProxyFactoryProvider {
    token: any;
    injected: any[];
    useFactory: (...args: any[]) => any | Promise<any>;
}

export type ProxyProvider = ProxyClassProvider | ProxyFactoryProvider;
