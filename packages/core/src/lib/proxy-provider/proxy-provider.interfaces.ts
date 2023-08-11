import { Provider, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export interface ClsModuleProxyClassProviderOptions {
    /**
     * Custom injection token to use for the provider. In case of a class provider,
     * this parameter is optional, as the class reference passed to `useClass` will
     * be used by default.
     */
    provide?: any;

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
     * The target class that will be used by this Proxy Provider. Make sure it is decorated with `@InjectableProxy`.
     */
    useClass: Type;
}
export interface ClsModuleProxyFactoryProviderOptions {
    /**
     * Custom injection token to use for the provider. In case of a class provider,
     * this parameter is optional, as the class reference passed to `useClass` will
     * be used by default.
     */
    provide: any;

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
     * An array of injection tokens for providers used in the `useFactory`.
     */
    inject?: any[];

    /**
     * Factory function that accepts an array of providers in the order of the according tokens in the `inject` array.
     * Returns (or resolves with) an object (or a function) that will be used by this Proxy Provider.
     */
    useFactory: (...args: any[]) => any;
}

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
