import { AsyncLocalStorage } from 'async_hooks';
import { CLS_ID } from './cls.constants';

export class ClsService<S = Record<string, any>> {
    private readonly namespace: AsyncLocalStorage<any>;
    constructor(namespace: AsyncLocalStorage<any>) {
        this.namespace = namespace;
    }

    set<T = any>(key: string, value: T) {
        const store = this.namespace.getStore();
        if (!store) {
            throw new Error(
                `Cannot se the key "${key}". No cls context available in namespace "${this.namespace['name']}", please make sure to wrap any calls that depend on cls with "ClsService#run" or register the ClsMiddleware for all routes that use ClsService`,
            );
        }
        store[key] = value;
    }

    get<T = any>(key: string): T {
        const store = this.namespace.getStore();
        return store?.[key];
    }

    getId(): string {
        const store = this.namespace.getStore();
        return store?.[CLS_ID];
    }

    getStore(): S {
        return this.namespace.getStore();
    }

    runAndReturn<T = any>(callback: () => T) {
        return this.namespace.run({}, callback);
    }

    run<T = any>(callback: () => T) {
        return this.namespace.run({}, callback);
    }

    enter() {
        return this.namespace.enterWith({});
    }

    isActive() {
        return !!this.namespace.getStore();
    }
}
