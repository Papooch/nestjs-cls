import { AsyncLocalStorage } from 'async_hooks';
import { CLS_ID } from './cls.constants';

export class ClsService<S = Record<string, any>> {
    private readonly namespace: AsyncLocalStorage<any>;
    constructor(namespace: AsyncLocalStorage<any>) {
        this.namespace = namespace;
    }

    /**
     * Set a value on the CLS context.
     * @param key the key
     * @param value the value to set
     */
    set<T = any>(key: string, value: T) {
        const store = this.namespace.getStore();
        if (!store) {
            throw new Error(
                `Cannot se the key "${key}". No cls context available in namespace "${this.namespace['name']}", please make sure to wrap any calls that depend on cls with "ClsService#run" or register the ClsMiddleware for all routes that use ClsService`,
            );
        }
        store[key] = value;
    }

    /**
     * Retrieve a value from the CLS context by key.
     * @param key the key from which to retrieve the value
     * @returns the value stored under the key or undefined
     */
    get<T = any>(key: string): T {
        const store = this.namespace.getStore();
        return store?.[key];
    }

    /**
     * Retrieve the request ID (a shorthand for `cls.get(CLS_ID)`)
     * @returns the request ID or undefined
     */
    getId(): string {
        const store = this.namespace.getStore();
        return store?.[CLS_ID];
    }

    /**
     * Retrieve the object containing all properties of the current CLS context.
     * @returns the store
     */
    getStore(): S {
        return this.namespace.getStore();
    }

    /**
     * Run the callback with a shared CLS context.
     * @param callback function to run
     * @returns whatever the callback returns
     */
    run<T = any>(callback: () => T) {
        return this.namespace.run({}, callback);
    }

    /**
     * Run the callbacks with a shared CLS context.
     * @param store the default context contents
     * @param callback function to run
     * @returns whatever the callback returns
     */
    runWith<T = any>(store: any, callback: () => T) {
        return this.namespace.run(store ?? {}, callback);
    }

    /**
     * Run any following code with a shared CLS context.
     */
    enter() {
        return this.namespace.enterWith({});
    }

    /**
     * Run any following code with a shared ClS context
     * @param store the default context contents
     */
    enterWith(store: any = {}) {
        return this.namespace.enterWith(store);
    }

    /**
     * Run the callback outside of a shared CLS context
     * @param callback function to run
     * @returns whatever the callback returns
     */
    exit<T = any>(callback: () => T): T {
        return this.namespace.exit(callback);
    }

    /**
     * Whether the current code runs within an active CLS context.
     * @returns true if a CLS context is active
     */
    isActive() {
        return !!this.namespace.getStore();
    }
}
