import { globalClsSevice } from './cls-service.globals';
import { ClsStore } from './cls.interfaces';
import { ClsService } from './cls.service';
import { ProxyProviderManager } from './proxy-provider/proxy-provider-manager';

export class ClsServiceManager {
    private static clsService = globalClsSevice;

    /**
     * Retrieve a ClsService outside of Nest's DI.
     * @returns the ClsService
     */
    static getClsService<T extends ClsStore = ClsStore>(): ClsService<T> {
        const cls = this.clsService as ClsService<T>;
        return cls;
    }

    static async resolveProxyProviders() {
        return await ProxyProviderManager.resolveProxyProviders();
    }
}
