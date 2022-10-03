import { FactoryProvider, Type, ValueProvider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UnknownDependenciesException } from '@nestjs/core/errors/exceptions/unknown-dependencies.exception';
import { globalClsSevice } from '../cls-service.globals';
import { CLS_PROXY_METADATA_KEY } from './proxy-provider.constants';
import {
    ProxyProviderNotDecoratedException,
    UnknownProxyDependenciesException,
} from './proxy-provider.exceptions';
import {
    isProxyClassProvider,
    isProxyClassProviderOptions,
} from './proxy-provider.functions';
import {
    ClsModuleProxyClassProviderOptions,
    ClsModuleProxyFactoryProviderOptions,
    ClsModuleProxyProviderOptions,
    ProxyClassProvider,
    ProxyFactoryProvider,
    ProxyProvider,
} from './proxy-provider.interfaces';

export class ProxyProviderManager {
    private static clsService = globalClsSevice;
    private static proxyProviderMap = new Map<symbol, ProxyProvider>();

    static createProxyProvider(options: ClsModuleProxyProviderOptions) {
        const providerSymbol = this.getProxyProviderSymbol(options);
        const proxy = this.createProxy(providerSymbol);
        const proxyProvider: FactoryProvider = {
            provide: this.getProxyProviderToken(options),
            inject: [
                ModuleRef,
                ...((options as ClsModuleProxyFactoryProviderOptions).inject ??
                    []),
            ],
            useFactory: (moduleRef: ModuleRef, ...injected: any[]) => {
                let providerOptions: ProxyProvider;
                if (isProxyClassProviderOptions(options)) {
                    this.throwIfClassHasNoProxyMetadata(options.useClass);
                    providerOptions = {
                        moduleRef,
                        token: options.provide,
                        useClass: options.useClass,
                    };
                } else {
                    providerOptions = {
                        injected,
                        token: options.provide,
                        useFactory: options.useFactory,
                    };
                }
                this.proxyProviderMap.set(providerSymbol, providerOptions);
                return proxy;
            },
        };
        return proxyProvider;
    }

    static createProxyProviderFromExistingKey(providerKey: symbol | string) {
        const proxy = this.createProxy(providerKey);
        const proxyProvider: ValueProvider = {
            provide: providerKey,
            useValue: proxy,
        };
        return proxyProvider;
    }

    private static getProxyProviderSymbol(
        options: ClsModuleProxyProviderOptions,
    ) {
        const maybeExistingSymbol =
            typeof options.provide == 'symbol' ? options.provide : undefined;
        return (
            maybeExistingSymbol ??
            Symbol.for(
                options.provide?.toString() ??
                    (options as ClsModuleProxyClassProviderOptions).useClass
                        .name,
            )
        );
    }

    private static getProxyProviderToken(
        options: ClsModuleProxyProviderOptions,
    ) {
        return (
            options.provide ??
            (options as ClsModuleProxyClassProviderOptions).useClass
        );
    }

    private static createProxy(providerKey: symbol | string): any {
        const getProvider = () => this.clsService.get()?.[providerKey] ?? {};
        return new Proxy(() => null, {
            apply(_, thisArg, argArray) {
                return getProvider().apply(thisArg, argArray);
            },
            get(_, prop) {
                return getProvider()[prop];
            },
            set(_, prop, value) {
                return (getProvider()[prop] = value);
            },
            ownKeys() {
                return Reflect.ownKeys(getProvider());
            },
            getPrototypeOf() {
                return Reflect.getPrototypeOf(getProvider());
            },
            getOwnPropertyDescriptor(_, prop) {
                return Reflect.getOwnPropertyDescriptor(getProvider(), prop);
            },
            has(_, prop) {
                return Reflect.has(getProvider(), prop);
            },
        });
    }

    static async resolveProxyProviders() {
        const promises = [...this.proxyProviderMap.keys()].map(
            (providerSymbol) => this.resolveProxyProvider(providerSymbol),
        );
        return await Promise.all(promises);
    }

    private static async resolveProxyProvider(providerSymbol: symbol) {
        const provider = this.proxyProviderMap.get(providerSymbol);
        if (isProxyClassProvider(provider)) {
            await this.resolveProxyClassProvider(providerSymbol, provider);
        } else {
            await this.resolveProxyFactoryProvider(providerSymbol, provider);
        }
    }

    private static async resolveProxyClassProvider(
        providerSymbol: symbol,
        provider: ProxyClassProvider,
    ) {
        const moduleRef = provider.moduleRef;
        const Provider = provider.useClass;

        try {
            const proxyProvider = await moduleRef.create(Provider);
            this.clsService.set(providerSymbol, proxyProvider);
        } catch (error: unknown) {
            if (!(error instanceof UnknownDependenciesException)) throw error;
            throw UnknownProxyDependenciesException.create(error, Provider);
        }
    }

    private static throwIfClassHasNoProxyMetadata(Provider: Type) {
        const hasMetadata = Reflect.getMetadata(
            CLS_PROXY_METADATA_KEY,
            Provider,
        );
        if (!hasMetadata) {
            throw ProxyProviderNotDecoratedException.create(Provider);
        }
    }

    private static async resolveProxyFactoryProvider(
        providerSymbol: symbol,
        provider: ProxyFactoryProvider,
    ) {
        const injected = provider.injected;
        const proxyProvider = await provider.useFactory.apply(null, injected);
        this.clsService.set(providerSymbol, proxyProvider);
    }
}
