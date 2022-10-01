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
import { ClsStore } from './cls.interfaces';

export class ClsService<S extends ClsStore = ClsStore> {
    constructor(private readonly als: AsyncLocalStorage<any>) {}

    /**
     * Set a value on the CLS context.
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
                `Cannot se the key "${String(
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
            return store[key];
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
            return !!store[key];
        }
        return !!getValueFromPath(store as S, key as any);
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
     * @param callback function to run
     * @returns whatever the callback returns
     */
    run<T = any>(callback: () => T) {
        return this.als.run({}, callback);
    }

    /**
     * Run the callbacks with a shared CLS context.
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
    enter() {
        return this.als.enterWith({});
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
}
