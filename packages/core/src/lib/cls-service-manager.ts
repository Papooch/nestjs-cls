import { globalClsService } from './cls-service.globals';
import { ClsStore } from './cls.options';
import { ClsService } from './cls.service';

export class ClsServiceManager {
    private static clsService = globalClsService;

    /**
     * Retrieve a ClsService outside of Nest's DI.
     * @returns the ClsService
     */
    static getClsService<T extends ClsStore = ClsStore>(): ClsService<T> {
        const cls = this.clsService as ClsService<T>;
        return cls;
    }
}
