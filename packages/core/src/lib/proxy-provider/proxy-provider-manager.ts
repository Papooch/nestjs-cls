import { FactoryProvider, Type, ValueProvider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UnknownDependenciesException } from '@nestjs/core/errors/exceptions/unknown-dependencies.exception';
import { globalClsService } from '../cls-service.globals';
import { getProxyProviderSymbol } from './get-proxy-provider-symbol';
import { CLS_PROXY_METADATA_KEY } from './proxy-provider.constants';
import {
    ProxyProviderNotDecoratedException,
    ProxyProviderNotRegisteredException,
    ProxyProviderNotResolvedException,
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
    ClsProxyFactoryReturnType,
    ProxyClassProvider,
    ProxyFactoryProvider,
    ProxyProvider,
} from './proxy-provider.interfaces';
import { InjectableProxyMetadata } from './injectable-proxy.decorator';

type ProxyOptions = {
    type?: ClsProxyFactoryReturnType;
    strict?: boolean;
};

export class ProxyProviderManager {
    private static clsService = globalClsService;
    private static proxyProviderMap = new Map<symbol, ProxyProvider>();

    /**
     * Init method called by the ClsModule#forRoot/Async
     *
     * It ensures that the internal state is reset to support testing multiple setups in the same process.
     *
     * Otherwise the proxy provider map would leak from one test to the next.
     */
    static reset() {
        this.proxyProviderMap = new Map();
    }

    static createProxyProvider(options: ClsModuleProxyProviderOptions) {
        const providerToken = this.getProxyProviderToken(options);
        const providerSymbol = getProxyProviderSymbol(providerToken);

        let strict: boolean | undefined = undefined;
        if (isProxyClassProviderOptions(options)) {
            const metadata = this.getInjectableProxyMetadata(options.useClass);
            strict = metadata.strict;
        }
        strict = options.strict ?? strict ?? false;

        const proxy = this.createProxy(providerSymbol, {
            strict,
            type: (options as ClsModuleProxyFactoryProviderOptions).type,
        });
        const proxyProvider: FactoryProvider = {
            provide: providerToken,
            inject: [
                ModuleRef,
                ...((options as ClsModuleProxyFactoryProviderOptions).inject ??
                    []),
            ],
            useFactory: (moduleRef: ModuleRef, ...injected: any[]) => {
                let providerOptions: ProxyProvider;
                if (isProxyClassProviderOptions(options)) {
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

    private static getInjectableProxyMetadata(
        Provider: Type,
    ): InjectableProxyMetadata {
        const metadata = Reflect.getMetadata(CLS_PROXY_METADATA_KEY, Provider);
        if (!metadata) {
            throw ProxyProviderNotDecoratedException.create(Provider);
        }
        return metadata;
    }

    private static getProxyProviderToken(
        options: ClsModuleProxyProviderOptions,
    ) {
        return (
            options.provide ??
            (options as ClsModuleProxyClassProviderOptions).useClass
        );
    }

    private static createProxy(
        providerKey: symbol | string,
        { type = 'object', strict = false }: ProxyOptions = {},
    ): any {
        const checkAccess = getPropertyAccessChecker(providerKey, strict);
        const getProvider = () => this.clsService.get()?.[providerKey];
        const getProviderOrEmpty = () => getProvider() ?? {};
        const baseType = type === 'function' ? () => null : {};

        return new Proxy(baseType, {
            apply(_, __, argArray) {
                const provider = getProvider() ?? checkAccess();
                return provider.apply(provider, argArray);
            },
            get(_, propName) {
                const provider = getProvider() ?? checkAccess(propName);
                const prop = provider[propName];
                if (typeof prop === 'function') {
                    return prop.bind(provider);
                } else {
                    return prop;
                }
            },
            set(_, propName, value) {
                const provider = getProvider() ?? checkAccess(propName);
                return Reflect.set(provider, propName, value);
            },
            ownKeys() {
                return Reflect.ownKeys(getProviderOrEmpty());
            },
            getPrototypeOf() {
                return Reflect.getPrototypeOf(getProviderOrEmpty());
            },
            getOwnPropertyDescriptor(_, prop) {
                return Reflect.getOwnPropertyDescriptor(
                    getProviderOrEmpty(),
                    prop,
                );
            },
            has(_, prop) {
                return Reflect.has(getProviderOrEmpty(), prop);
            },
        });
    }

    static async resolveProxyProviders(providerSymbols?: symbol[]) {
        const providerSymbolsToResolve = providerSymbols?.length
            ? providerSymbols
            : Array.from(this.proxyProviderMap.keys());
        const promises = providerSymbolsToResolve.map((providerSymbol) =>
            this.resolveProxyProvider(providerSymbol),
        );
        await Promise.all(promises);
    }

    private static async resolveProxyProvider(providerSymbol: symbol) {
        if (this.clsService.get(providerSymbol)) {
            // skip resolution if the provider already exists in the CLS
            return;
        }
        const provider = this.proxyProviderMap.get(providerSymbol);
        if (!provider) {
            throw ProxyProviderNotRegisteredException.create(providerSymbol);
        }
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

    private static async resolveProxyFactoryProvider(
        providerSymbol: symbol,
        provider: ProxyFactoryProvider,
    ) {
        const injected = provider.injected;
        const proxyProvider = await provider.useFactory.apply(null, injected);
        this.clsService.set(providerSymbol, proxyProvider);
    }
}

const allowedPropertyAccess = new Set([
    // used by Nest to check for async providers
    'then',
    // checked by Nest to trigger lifecycle hooks
    'onModuleInit',
    'onApplicationBootstrap',
    'onModuleDestroy',
    'beforeApplicationShutdown',
    'onApplicationShutdown',
]);

/**
 * To enable strict mode, which means throwing an error when a property on an unresolved proxy provider is accessed,
 * we still need to allow access to some properties in order for Nest to bootstrap properly.
 *
 * This is because Nest checks for the presence of some properties of all providers in the bootstrap process,
 * but at that time, all Proxy providers are still undefined.
 */
function getPropertyAccessChecker(
    providerKey: symbol | string,
    strict: boolean,
) {
    const empty = {};

    if (!strict) {
        return () => empty;
    }
    return function checkAllowedPropertyAccess(propName?: string | symbol) {
        if (!propName || !allowedPropertyAccess.has(propName.toString())) {
            throw ProxyProviderNotResolvedException.create(
                providerKey,
                propName?.toString(),
            );
        }
        return empty;
    };
}
