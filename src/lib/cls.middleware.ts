import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { ClsServiceManager } from '..';
import { CLS_ID, CLS_MIDDLEWARE_OPTIONS } from './cls.constants';
import { CLS_REQ, CLS_RES } from './cls.constants';
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
    use = (req: any, res: any, next: () => any) => {
        const cls = ClsServiceManager.getClsService(this.options.namespaceName);
        cls.run(() => {
            if (this.options.generateId)
                cls.set(CLS_ID, this.options.idGenerator(req));
            if (this.options.saveReq) cls.set(CLS_REQ, req);
            if (this.options.saveRes) cls.set(CLS_RES, res);
            next();
        });
    };
}
