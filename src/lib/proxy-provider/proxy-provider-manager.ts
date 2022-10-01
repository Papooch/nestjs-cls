import { FactoryProvider, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UnknownDependenciesException } from '@nestjs/core/errors/exceptions/unknown-dependencies.exception';
import { globalClsSevice } from '../cls-service.globals';
import { CLS_PROXY_METADATA_KEY } from './proxy-provider.constants';
import {
    isProxyFactoryProvider,
    isProxyFactoryProviderOptions,
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
        const providerSymbol = Symbol.for(
            options.provide?.toString() ??
                (options as ClsModuleProxyClassProviderOptions).useClass.name,
        );
        const getProvider = () => this.clsService.get()?.[providerSymbol] ?? {};

        const providerProxy = new Proxy(() => null, {
            apply(_, thisArg, argArray) {
                console.log('calling', providerSymbol);
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

        const proxyProvider: FactoryProvider = {
            provide:
                options.provide ??
                (options as ClsModuleProxyClassProviderOptions).useClass,
            inject: [
                ModuleRef,
                ...((options as ClsModuleProxyFactoryProviderOptions).inject ??
                    []),
            ],
            useFactory: (moduleRef: ModuleRef, ...injected: any[]) => {
                let providerOptions: ProxyProvider;
                if (isProxyFactoryProviderOptions(options)) {
                    providerOptions = {
                        injected,
                        token: options.provide,
                        useFactory: options.useFactory,
                    };
                } else {
                    providerOptions = {
                        moduleRef,
                        token: options.provide,
                        useClass: options.useClass,
                    };
                }
                this.proxyProviderMap.set(providerSymbol, providerOptions);
                return providerProxy;
            },
        };
        return proxyProvider;
    }

    static async resolveProxyProviders() {
        const promises = [...this.proxyProviderMap.keys()].map(
            (providerSymbol) => this.resolveProxyProvider(providerSymbol),
        );
        return await Promise.all(promises);
    }

    private static async resolveProxyProvider(providerSymbol: symbol) {
        const provider = this.proxyProviderMap.get(providerSymbol);
        if (isProxyFactoryProvider(provider)) {
            await this.resolveProxyFactoryProvider(providerSymbol, provider);
        } else {
            await this.resolveProxyClassProvider(providerSymbol, provider);
        }
    }

    private static async resolveProxyClassProvider(
        providerSymbol: symbol,
        provider: ProxyClassProvider,
    ) {
        const moduleRef = provider.moduleRef;
        const Provider = provider.useClass;

        const hasMetadata = Reflect.getMetadata(
            CLS_PROXY_METADATA_KEY,
            Provider,
        );
        if (!hasMetadata) {
            throw new Error(
                `Cannot create a proxy provider for ${Provider.name}. The class must be decorated with the @InjectableProxy() decorator to distinguish it from a regular provider.`,
            );
        }

        try {
            const proxyProvider = await moduleRef.create(Provider);
            this.clsService.set(providerSymbol, proxyProvider);
        } catch (error: unknown) {
            if (!(error instanceof UnknownDependenciesException)) throw error;
            throw this.createUnknownDependenciesException(error, Provider);
        }
    }

    private static async resolveProxyFactoryProvider(
        providerSymbol: symbol,
        provider: ProxyFactoryProvider,
    ) {
        const injected = provider.injected;
        const proxyProvider = await provider.useFactory.apply(null, injected);
        console.log('FACTORX', proxyProvider);
        this.clsService.set(providerSymbol, proxyProvider);
    }

    private static createUnknownDependenciesException(
        error: UnknownDependenciesException,
        Provider: Type,
    ) {
        const expectedParams = Reflect.getMetadata(
            'design:paramtypes',
            Provider,
        );
        const foundParams = this.extractDependencyParams(error);
        const notFoundIndex = foundParams.findIndex((it) => it == '?');
        console.log(foundParams);
        let notFoundParamName = expectedParams[notFoundIndex]?.name;
        if (!notFoundParamName) {
            notFoundParamName = Reflect.getMetadata('self:paramtypes', Provider)
                ?.find((param: any) => param?.index == notFoundIndex)
                .param.toString();
        }
        return new Error(`Cannot create Proxy provider ${
            Provider.name
        } (${foundParams.join(
            ', ',
        )}). The argument ${notFoundParamName} at index [${notFoundIndex}] was not found in the ClsModule Context.

        Potential solutions:
        - If ${notFoundParamName} depends on more things than just ClsService, use "ClsModule.forRootAsync()" to inject those
        `);
    }

    private static extractDependencyParams(
        error: UnknownDependenciesException,
    ) {
        // matches the parameters from NestJS's error message:
        // e.g: "Nest can't resolve dependencies of the Something (Cats, ?). [...]"
        // returns ['Cats', '?']
        return error.message.match(/\w+ \((.*?)\)./)[1].split(', ');
    }
}
