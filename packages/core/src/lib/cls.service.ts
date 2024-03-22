import { AsyncLocalStorage } from 'async_hooks';
import {
    DeepPropertyType,
    RecursiveKeyOf,
} from '../types/recursive-key-of.type';
import {
    AnyIfNever,
    StringIfNever,
    TypeIfUndefined,
} from '../types/type-if-type.type';
import { getValueFromPath, setValueFromPath } from '../utils/value-from-path';
import { CLS_ID } from './cls.constants';
import { ClsContextOptions, ClsStore } from './cls.options';
import { getProxyProviderSymbol } from './proxy-provider/get-proxy-provider-symbol';

export class ClsService<S extends ClsStore = ClsStore> {
    constructor(private readonly als: AsyncLocalStorage<any>) {
        if (!als) {
            throw new Error(
                `Cannot create ClsService because no AsyncLocalStorage instance was provided.\nPlease make sure that ClsService is only provided by the ClsModule and not constructed manually or added to the providers array.`,
            );
        }
    }

    /**
     * Set (or overrides) a value on the CLS context.
     * @param key the key
     * @param value the value to set
     */
    set<
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        R = undefined,
        T extends RecursiveKeyOf<S> = any,
        P extends DeepPropertyType<S, T> = any,
    >(key: StringIfNever<T> | keyof ClsStore, value: AnyIfNever<P>): void {
        const store = this.als.getStore();
        if (!store) {
            throw new Error(
                `Cannot set the key "${String(
                    key,
                )}". No CLS context available, please make sure that a ClsMiddleware/Guard/Interceptor has set up the context, or wrap any calls that depend on CLS with "ClsService#run"`,
            );
        }
        if (typeof key === 'symbol') {
            store[key] = value;
        } else {
            setValueFromPath(store as S, key as any, value as P);
        }
    }

    /**
     * Set a value on the CLS context if it doesn't already exist
     * @param key the key
     * @param value the value to set
     * @returns `true` if value vas set, `false` if it existed before
     */
    setIfUndefined<
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        R = undefined,
        T extends RecursiveKeyOf<S> = any,
        P extends DeepPropertyType<S, T> = any,
    >(key: StringIfNever<T> | keyof ClsStore, value: AnyIfNever<P>): boolean {
        if (this.has(key)) return false;
        this.set(key, value);
        return true;
    }

    /**
     * Retrieve the whole CLS context
     * @returns the value stored under the key or undefined
     */
    get(): AnyIfNever<S>;
    /**
     * Retrieve a value from the CLS context by key.
     * @param key the key from which to retrieve the value, returns the whole context if ommited
     * @returns the value stored under the key or undefined
     */
    get<
        R = undefined,
        T extends RecursiveKeyOf<S> = any,
        P = DeepPropertyType<S, T>,
    >(
        key?: StringIfNever<T> | keyof ClsStore,
    ): TypeIfUndefined<R, TypeIfUndefined<typeof key, S, AnyIfNever<P>>, R>;
    get(key?: string | symbol): any {
        const store = this.als.getStore();
        if (!key) return store;
        if (typeof key === 'symbol') {
            return store?.[key];
        }
        return getValueFromPath(store as S, key as any) as any;
    }

    /**
     * Check if a key is in the CLS context
     * @param key the key to check
     * @returns true if the key is in the CLS context
     */
    has<T extends RecursiveKeyOf<S> = any>(
        key: StringIfNever<T> | keyof ClsStore,
    ): boolean;
    has(key: string | symbol): boolean {
        const store = this.als.getStore();
        if (typeof key === 'symbol') {
            return store?.[key] !== undefined;
        }
        return getValueFromPath(store as S, key as any) !== undefined;
    }

    /**
     * Retrieve the request ID (a shorthand for `cls.get(CLS_ID)`)
     * @returns the request ID or undefined
     */
    getId(): string {
        const store = this.als.getStore();
        return store?.[CLS_ID];
    }

    /**
     * Run the callback with a shared CLS context.
     * @returns whatever the callback returns
     */
    run<T = any>(callback: () => T): T;
    run<T = any>(options: ClsContextOptions, callback: () => T): T;
    run(optionsOrCallback: any, maybeCallback?: any) {
        let options: ClsContextOptions;
        let callback: () => any;
        if (typeof optionsOrCallback === 'object') {
            options = { ...new ClsContextOptions(), ...optionsOrCallback };
            callback = maybeCallback;
        } else {
            options = new ClsContextOptions();
            callback = optionsOrCallback;
        }
        if (!this.isActive()) return this.runWith({} as S, callback);
        switch (options.ifNested) {
            case 'inherit':
                return this.runWith({ ...this.get() }, callback);
            case 'reuse':
                return callback();
            case 'override':
                return this.runWith({} as S, callback);
        }
    }

    /**
     * Run the callbacks with a new CLS context.
     *
     * @param store the default context contents
     * @param callback function to run
     * @returns whatever the callback returns
     */
    runWith<T = any>(store: S, callback: () => T) {
        return this.als.run(store ?? {}, callback);
    }

    /**
     * Run any following code with a shared CLS context.
     */
    enter(): void;
    enter(options: ClsContextOptions): void;
    enter(maybeOptions?: ClsContextOptions) {
        if (!this.isActive()) return this.als.enterWith({});
        const options = { ...new ClsContextOptions(), ...maybeOptions };
        switch (options.ifNested) {
            case 'inherit':
                return this.enterWith({ ...this.get() });
            case 'reuse':
                return;
            case 'override':
                return this.enterWith({} as S);
        }
    }

    /**
     * Run any following code with a shared ClS context
     * @param store the default context contents
     */
    enterWith(store?: S) {
        return this.als.enterWith(store ?? {});
    }

    /**
     * Run the callback outside of a shared CLS context
     * @param callback function to run
     * @returns whatever the callback returns
     */
    exit<T = any>(callback: () => T): T {
        return this.als.exit(callback);
    }

    /**
     * Whether the current code runs within an active CLS context.
     * @returns true if a CLS context is active
     */
    isActive() {
        return !!this.als.getStore();
    }

    /**
     * Retrieve a Proxy provider from the CLS context
     * based on its injection token.
     */
    getProxy<T = any>(proxyToken: string | symbol): T;
    getProxy<T>(proxyToken: new (...args: any) => T): T;
    getProxy(proxyToken: any) {
        return this.get(getProxyProviderSymbol(proxyToken));
    }

    /**
     * Replace an instance of a Proxy provider in the CLS context
     * based on its injection token.
     */
    setProxy<T = any>(proxyToken: string | symbol, value: T): void;
    setProxy<T>(proxyToken: new (...args: any) => T, value: T): void;
    setProxy(proxyToken: any, value: any) {
        return this.set(getProxyProviderSymbol(proxyToken), value);
    }

    /**
     * Use to manually trigger resolution of Proxy Providers
     * in case `resolveProxyProviders` is not enabled in the enhancer.
     *
     * @param proxyTokens An optional array of Proxy Provider injection tokens
     * to resolve. If not supplied, resolves all registered proxy providers.
     */
    async resolveProxyProviders(proxyTokens?: any[]) {
        // Workaround for a circular dep
        // TODO: This should be untangled and cleaned up
        const { ProxyProviderManager } = await import(
            './proxy-provider/proxy-provider-manager'
        );
        const proxySymbols = proxyTokens
            ? proxyTokens.map(getProxyProviderSymbol)
            : [];
        await ProxyProviderManager.resolveProxyProviders(proxySymbols);
    }

    async initializePlugins() {
        const { ClsPluginManager } = await import(
            './plugin/cls-plugin-manager'
        );
        await ClsPluginManager.onClsInit();
    }
}
