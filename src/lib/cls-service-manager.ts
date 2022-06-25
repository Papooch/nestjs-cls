import { Type, ValueProvider } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { ClsStore } from './cls.interfaces';
import { ClsService } from './cls.service';

export const proxyProviders: ValueProvider[] = [];

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

    private static async resolveProxyProvider(Provider: Type) {
        const providerSymbol = Symbol.for(Provider.name);
        this.clsService.set(providerSymbol, new Provider(this.clsService));
    }

    static async resolveProxyProviders() {
        return Promise.all([
            proxyProviders.map((p) =>
                this.resolveProxyProvider(p.provide as any),
            ),
        ]);
    }
}

export function createProxyProvider(Provider: Type) {
    const cls = ClsServiceManager.getClsService();

    const providerSymbol = Symbol.for(Provider.name);
    const getProvider = () => cls.get()?.[providerSymbol] ?? {};

    const providerProxy = new Proxy(
        {},
        {
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
        },
    );
    const proxyProvider: ValueProvider = {
        provide: Provider,
        useValue: providerProxy,
    };
    proxyProviders.push(proxyProvider);
    return proxyProvider;
}
