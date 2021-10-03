import { ClassProvider, ValueProvider } from '@nestjs/common';
import { createNamespace, Namespace } from 'cls-hooked';
import { CLS_DEFAULT_NAMESPACE } from './cls.constants';
import { ClsService } from './cls.service';
import { AsyncLocalStorage } from 'async_hooks';

export const getClsServiceToken = (namespace: string) =>
    `ClsService-${namespace}`;

export class ClsServiceManager {
    private static namespaces: Record<string, AsyncLocalStorage<any>> = {};

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
        }
        return this.namespaces[name];
    }

    static addClsService(name: string) {
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
