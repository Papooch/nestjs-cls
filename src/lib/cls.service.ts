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
import { valueFromPath } from '../utils/value-from-path';
import { CLS_ID } from './cls.constants';
import { ClsStore } from './cls.interfaces';

/*
let a: ClsService; //<{ a: { v: string } }>;
let b: ClsService<{ a: { v: string } }>;

a.set('x', 7);
const p = a.get('x');
const x = a.get('x');
const u = a.get(CLS_REQ);

b.set('u', 4);
const e = b.get();
const y = b.get('a');
const v = b.get('a.v');
const z = b.get(CLS_REQ);

type A = TypeIfType<typeof CLS_REQ, symbol, string, number>;
*/

export class ClsService<S extends ClsStore = ClsStore> {
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
                `Cannot se the key "${key}". No cls context available in namespace "${this.namespace['name']}", please make sure that a ClsMiddleware/Guard/Interceptor has set up the context, or wrap any calls that depend on cls with "ClsService#run"`,
            );
        }
        store[key] = value;
    }

    /**
     * Retrieve a value from the CLS context by key.
     * @param key the key from which to retrieve the value, returns the whole context if ommited
     * @returns the value stored under the key or undefined
     */
    get(): AnyIfNever<S>;
    /**
     * Retrieve a value from the CLS context by key.
     * @param key the key from which to retrieve the value
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
        const store = this.namespace.getStore();
        if (!key) return store;
        return valueFromPath(store as S, key as any) as any;
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
    runWith<T = any>(store: S, callback: () => T) {
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
    enterWith(store?: S) {
        return this.namespace.enterWith(store ?? {});
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
