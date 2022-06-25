import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { ClsServiceManager } from './cls-service-manager';
import {
    CLS_ID,
    CLS_MIDDLEWARE_OPTIONS,
    CLS_REQ,
    CLS_RES,
} from './cls.constants';
import { ClsMiddlewareOptions } from './cls.interfaces';
import { ClsService } from './cls.service';

@Injectable()
export class ClsMiddleware implements NestMiddleware {
    private readonly cls: ClsService;

    constructor(
        @Inject(CLS_MIDDLEWARE_OPTIONS)
        private readonly options?: Omit<ClsMiddlewareOptions, 'mount'>,
    ) {
        this.options = { ...new ClsMiddlewareOptions(), ...options };
    }
    use = async (req: any, res: any, next: () => any) => {
        const cls = ClsServiceManager.getClsService();
        const callback = async () => {
            this.options.useEnterWith && cls.enter();
            if (this.options.generateId) {
                const id = await this.options.idGenerator(req);
                cls.set<any>(CLS_ID, id);
            }
            if (this.options.saveReq) cls.set<any>(CLS_REQ, req);
            if (this.options.saveRes) cls.set<any>(CLS_RES, res);
            if (this.options.setup) {
                await this.options.setup(cls, req);
            }
            await ClsServiceManager.resolveProxyProviders();
            next();
        };
        const runner = this.options.useEnterWith
            ? cls.exit.bind(cls)
            : cls.run.bind(cls);
        runner(callback);
    };
}
