import { AsyncLocalStorage } from 'async_hooks';
import { ClsStore } from './cls.interfaces';
import { ClsService } from './cls.service';

export class ClsServiceManager {
    private static als = new AsyncLocalStorage();
    private static clsService = new ClsService(this.als);

    /**
     * Retrieve a ClsService outside of Nest's DI.
     * @returns the ClsService
     */
    static getClsService<T extends ClsStore = ClsStore>(): ClsService<T> {
        const cls = this.clsService as ClsService<T>;
        return cls;
    }
}
