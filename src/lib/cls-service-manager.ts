import { ClassProvider, ValueProvider } from '@nestjs/common';
import { CLS_DEFAULT_NAMESPACE } from './cls.constants';
import { ClsService } from './cls.service';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Get ClsService injection token (as a string)
 */
export function getClsServiceToken(): string;
/**
 * Get namespaced ClsService injection token (as a string)
 * @param namespace name of the namespace
 * @deprecated Namespace support will be removed in v3.0 
 */
export function getClsServiceToken(namespace: string): string;
export function getClsServiceToken(namespace = CLS_DEFAULT_NAMESPACE) {
    return `ClsService-${namespace}`;
}

export class ClsServiceManager {
    private static namespaces: Record<
        string,
        AsyncLocalStorage<any> & { name?: string }
    > = {};

    private static clsServices: Map<string | typeof ClsService, ClsService> =
        new Map([
            [
                ClsService,
                new ClsService(this.resolveNamespace(CLS_DEFAULT_NAMESPACE)),
            ],
        ]);

    private static resolveNamespace(name: string) {
        if (!this.namespaces[name]) {
            this.namespaces[name] = new AsyncLocalStorage();
            this.namespaces[name].name = name;
        }
        return this.namespaces[name];
    }

    static addClsService(name: string = CLS_DEFAULT_NAMESPACE) {
        const service = new ClsService(this.resolveNamespace(name));
        this.clsServices.set(
            getClsServiceToken(name),
            new ClsService(this.resolveNamespace(name)),
        );
        return service;
    }

    /**
     * Retrieve a ClsService outside of Nest's DI.
     * @param name namespace name, omit for default
     * @returns the ClsService with the given namespace
     */
    static getClsService(name?: string) {
        const cls = this.clsServices.get(
            name ? getClsServiceToken(name) : ClsService,
        );
        if (!cls)
            throw new Error(`ClsService with namespace ${name} does not exist`);
        return cls;
    }

    static getClsServicesAsProviders(): Array<
        ClassProvider<ClsService> | ValueProvider<ClsService>
    > {
        return Array.from(this.clsServices.entries()).map(
            ([provide, service]) => ({
                provide,
                useValue: service,
            }),
        );
    }
}
