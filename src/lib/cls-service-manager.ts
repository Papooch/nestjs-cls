import {
    FactoryProvider,
    Injectable,
    Provider,
    SetMetadata,
    Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UnknownDependenciesException } from '@nestjs/core/errors/exceptions/unknown-dependencies.exception';
import { AsyncLocalStorage } from 'async_hooks';
import { CLS_PROXY_METADATA_KEY } from './cls.constants';
import { ClsStore } from './cls.interfaces';
import { ClsService } from './cls.service';

@Injectable()
export class InjectedProvider {
    property = 'value';
}
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
const isFactoryProviderOptions = (
    provider: ClsModuleProxyProviderOptions,
): provider is ClsModuleProxyFactoryProviderOptions =>
    Reflect.has(provider, 'useFactory');

interface ProxyClassProvider {
    token?: any;
    moduleRef: ModuleRef;
    useClass: Type;
}

interface ProxyFactoryProvider {
    token: any;
    moduleRef: ModuleRef;
    inject: any[];
    useFactory: (...args: any[]) => any | Promise<any>;
}

type ProxyProvider = ProxyClassProvider | ProxyFactoryProvider;

const isFactoryProvider = (
    provider: ProxyProvider,
): provider is ProxyFactoryProvider => Reflect.has(provider, 'useFactory');

export const InjectableProxy = () => (target: any) =>
    Injectable()(SetMetadata(CLS_PROXY_METADATA_KEY, true)(target));

//const proxyProviders: FactoryProvider[] = [];

const proxyProviderMap = new Map<symbol, ProxyProvider>();

function extractParams(error: UnknownDependenciesException) {
    return error.message.match(/\w+ \((.*)\)./)[1].split(', ');
}

export class ClsServiceManager {
    private static als = new AsyncLocalStorage();
    private static clsService = new ClsService(this.als);

    /**
     * Retrieve a ClsService outside of Nest's DI.
     * @returns the ClsService
     */
    static getClsService<T extends ClsStore = ClsStore>(): ClsService<T> {
        const cls = this.clsService as ClsService<T>;
        return cls;
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
        } catch (e: unknown) {
            if (!(e instanceof UnknownDependenciesException)) throw e;
            const expectedParams = Reflect.getMetadata(
                'design:paramtypes',
                Provider,
            );
            const foundParams = extractParams(e);
            const notFoundIndex = foundParams.findIndex((it) => it == '?');
            const notFoundParamName = expectedParams[notFoundIndex].name;
            throw new Error(`Cannot create Proxy provider ${
                Provider.name
            } (${foundParams.join(
                ', ',
            )}). The argument ${notFoundParamName} at index [${notFoundIndex}] was not found in the ClsModule Context.

            Potential solutions:
            - If ${notFoundParamName} depends on more things 
            `);
        }
    }

    private static async resolveProxyFactoryProvider(
        providerSymbol: symbol,
        provider: ProxyFactoryProvider,
    ) {
        const moduleRef = provider.moduleRef;
        const injects = provider.inject?.map((it) =>
            moduleRef.get(it, { strict: false }),
        );
        const proxyProvider = await provider.useFactory.apply(null, injects);
        console.log('FACTORX', proxyProvider);
        this.clsService.set(providerSymbol, proxyProvider);
    }

    private static async resolveProxyProvider(providerSymbol: symbol) {
        const provider = proxyProviderMap.get(providerSymbol);
        if (isFactoryProvider(provider)) {
            await this.resolveProxyFactoryProvider(providerSymbol, provider);
        } else {
            await this.resolveProxyClassProvider(providerSymbol, provider);
        }
    }

    static async resolveProxyProviders() {
        const promises = [...proxyProviderMap.keys()].map((providerSymbol) =>
            this.resolveProxyProvider(providerSymbol),
        );
        return await Promise.all(promises);
    }
}

export function createProxyProvider(options: ClsModuleProxyProviderOptions) {
    const cls = ClsServiceManager.getClsService();

    const providerSymbol = Symbol.for(
        options.provide?.toString() ??
            (options as ClsModuleProxyClassProviderOptions).useClass.name,
    );
    const getProvider = () => cls.get()?.[providerSymbol] ?? {};

    const providerProxy = new Proxy(() => null, {
        apply(target, thisArg, argArray) {
            console.log('calling', providerSymbol);
            return getProvider().apply(thisArg, argArray);
        },
        get(target, prop) {
            return getProvider()[prop];
        },
        set(target, prop, value) {
            return (getProvider()[prop] = value);
        },
        ownKeys() {
            return Reflect.ownKeys(getProvider());
        },
        getPrototypeOf() {
            return Reflect.getPrototypeOf(getProvider());
        },
        getOwnPropertyDescriptor(target, prop) {
            return Reflect.getOwnPropertyDescriptor(getProvider(), prop);
        },
        has(target, prop) {
            return Reflect.has(getProvider(), prop);
        },
    });

    const proxyProvider: FactoryProvider = {
        provide:
            options.provide ??
            (options as ClsModuleProxyClassProviderOptions).useClass,
        inject: [ModuleRef],
        useFactory: (moduleRef: ModuleRef) => {
            let providerOptions: ProxyProvider;
            if (isFactoryProviderOptions(options)) {
                providerOptions = {
                    moduleRef,
                    token: options.provide,
                    inject: options.inject,
                    useFactory: options.useFactory,
                };
            } else {
                providerOptions = {
                    moduleRef,
                    token: options.provide,
                    useClass: options.useClass,
                };
            }
            proxyProviderMap.set(providerSymbol, providerOptions);
            return providerProxy;
        },
    };
    return proxyProvider;
}
