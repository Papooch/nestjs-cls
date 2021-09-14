import { Namespace } from 'cls-hooked';
import { getDefaultNamespace } from './cls.globals';

export class ClsService {
    public readonly namespace: Namespace;
    constructor(namespace?: Namespace) {
        this.namespace = namespace ?? getDefaultNamespace();
    }

    set<T = any>(key: string, value: T) {
        try {
            return this.namespace.set(key, value);
        } catch (e) {
            throw new Error(
                `Cannot se the key "${key}". No cls context available in namespace "${this.namespace['name']}", please make sure to wrap any calls that depend on cls with "ClsService#run" or register the ClsMiddleware for all routes that use ClsService`,
            );
        }
    }

    get<T = any>(key: string): T {
        return this.namespace.get(key);
    }

    runAndReturn<T = any>(callback: () => T) {
        return this.namespace.runAndReturn(callback);
    }

    run<T = any>(callback: () => T) {
        return this.namespace.run(callback);
    }

    isActive() {
        return !!this.namespace.active;
    }
}
