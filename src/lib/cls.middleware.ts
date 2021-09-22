import { Inject, Injectable, NestMiddleware, Options } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { getClsServiceToken } from './cls-service-manager';
import { CLS_ID, CLS_MIDDLEWARE_OPTIONS } from './cls.constants';
import { CLS_REQ, CLS_RES } from './cls.constants';
import { ClsMiddlewareOptions } from './cls.interfaces';
import { ClsService } from './cls.service';

@Injectable()
export class ClsMiddleware implements NestMiddleware {
    private readonly cls: ClsService;

    constructor(
        @Inject(CLS_MIDDLEWARE_OPTIONS)
        private readonly options: ClsMiddlewareOptions,
        private readonly moduleRef: ModuleRef,
    ) {
        this.cls = this.moduleRef.get(
            getClsServiceToken(options.namespaceName),
        );
    }
    use(req: any, res: any, next: () => any) {
        this.cls.run(() => {
            if (this.options.generateId)
                this.cls.set(CLS_ID, this.options.idGenerator(req));
            if (this.options.saveReq) this.cls.set(CLS_REQ, req);
            if (this.options.saveRes) this.cls.set(CLS_RES, res);
            next();
        });
    }
}
