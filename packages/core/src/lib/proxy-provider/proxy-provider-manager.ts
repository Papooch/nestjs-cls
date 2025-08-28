import {
    FactoryProvider,
    InjectionToken,
    Type,
    ValueProvider,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { globalClsService } from '../cls-service.globals';
import { getProxyProviderSymbol } from './get-proxy-provider-symbol';
import { InjectableProxyMetadata } from './injectable-proxy.decorator';
import { ProxyProvidersResolver } from './proxy-provider-resolver';
import { CLS_PROXY_METADATA_KEY } from './proxy-provider.constants';
import {
    ProxyProviderNotDecoratedException,
    ProxyProviderNotResolvedException,
} from './proxy-provider.exceptions';
import { isProxyClassProviderOptions } from './proxy-provider.functions';
import {
    ClsModuleProxyClassProviderOptions,
    ClsModuleProxyFactoryProviderOptions,
    ClsModuleProxyProviderOptions,
    ClsProxyFactoryReturnType,
    ProxyClassProviderDefinition,
    ProxyFactoryProviderDefinition,
    ProxyProviderDefinition,
} from './proxy-provider.interfaces';
import { reflectAllClassDependencies } from './proxy-provider.utils';

type ProxyOptions = {
    type?: ClsProxyFactoryReturnType;
    strict?: boolean;
};

export class ProxyProviderManager {
    private static clsService = globalClsService;
    private static proxyProviderMap = new Map<
        symbol,
        ProxyProviderDefinition
    >();
    private static proxyProviderResolver?: ProxyProvidersResolver;

    /**
     * Reset method called by the ClsModule#forRoot/Async before the init method is called.
     *
     * It ensures that the internal state is reset to support testing multiple setups in the same process.
     *
     * Otherwise the proxy provider map would leak from one test to the next.
     *
     * FUTURE:
     * A better approach would be to store the proxy provider map in a local instance, instead of a global static variable.
     */
    static reset() {
        this.proxyProviderMap.clear();
    }

    /**
     * Init method called by the ClsRootModule#onModuleInit after it is certain
     * that all Proxy Providers have been registered.
     */
    static init() {
        // If there are no proxy providers, there is no need to set up the resolver.
        if (this.proxyProviderMap.size === 0) {
            return;
        }
        this.proxyProviderResolver = new ProxyProvidersResolver(
            this.clsService,
            this.proxyProviderMap,
        );
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

        let proxyProvider: FactoryProvider;
        if (isProxyClassProviderOptions(options)) {
            const dependencies = reflectAllClassDependencies(options.useClass);
            proxyProvider = {
                provide: providerToken,
                inject: [ModuleRef],
                useFactory: (moduleRef: ModuleRef) => {
                    const providerOptions: ProxyClassProviderDefinition = {
                        symbol: providerSymbol,
                        moduleRef,
                        dependencies,
                        provide: options.provide,
                        useClass: options.useClass,
                    };

                    this.proxyProviderMap.set(providerSymbol, providerOptions);
                    return proxy;
                },
            };
        } else {
            const dependencies = options.inject ?? [];
            proxyProvider = {
                provide: providerToken,
                inject: options.inject ?? [],
                useFactory: (...injected: any[]) => {
                    const providerOptions: ProxyFactoryProviderDefinition = {
                        symbol: providerSymbol,
                        injected,
                        dependencies,
                        provide: options.provide,
                        useFactory: options.useFactory,
                    };
                    this.proxyProviderMap.set(providerSymbol, providerOptions);
                    return proxy;
                },
            };
        }
        return proxyProvider;
    }

    static createProxyProviderFromExistingKey(
        providerKey: symbol | string,
        options?: ProxyOptions,
    ) {
        const proxy = this.createProxy(providerKey, options);
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
    ): InjectionToken {
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
                    return Object.assign(prop.bind(provider), prop);
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
        await this.proxyProviderResolver?.resolve(providerSymbols);
    }
}

const allowedPropertyAccess = new Set([
    // Allow all default properties of Object.prototype
    // as they're often used by other libraries for duck typing
    ...Object.getOwnPropertyNames(Object.prototype),
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
