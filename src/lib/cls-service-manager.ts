import { ClassProvider, ValueProvider } from '@nestjs/common';
import { createNamespace, Namespace } from 'cls-hooked';
import { CLS_DEFAULT_NAMESPACE } from './cls.constants';
import { ClsService } from './cls.service';

export const getClsServiceToken = (namespace: string) =>
    `ClsService-${namespace}`;

export class ClsServiceManager {
    private static namespaces: Record<string, Namespace> = {};

    private static clsServices: Map<string | typeof ClsService, ClsService> =
        new Map([
            [
                ClsService,
                new ClsService(this.resolveNamespace(CLS_DEFAULT_NAMESPACE)),
            ],
        ]);

    private static resolveNamespace(name: string) {
        if (!this.namespaces[name]) {
            this.namespaces[name] = createNamespace(
                name ?? CLS_DEFAULT_NAMESPACE,
            );
        }
        return this.namespaces[name];
    }

    // static setDefaultNamespace(name: string) {
    //     this.clsServices.set(
    //         ClsService,
    //         new ClsService(this.resolveNamespace(name)),
    //     );
    // }

    static addClsService(name: string) {
        const service = new ClsService(this.resolveNamespace(name));
        this.clsServices.set(
            getClsServiceToken(name),
            new ClsService(this.resolveNamespace(name)),
        );
        return service;
    }

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