import { Provider, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export interface ClsModuleProxyClassProviderOptions {
    provide?: any;
    imports?: any[];
    extraProviders?: Provider[];
    useClass: Type;
}
export interface ClsModuleProxyFactoryProviderOptions {
    provide: any;
    imports?: any[];
    extraProviders?: Provider[];
    inject?: any[];
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
