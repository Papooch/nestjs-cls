import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CLS_MIDDLEWARE_OPTIONS } from './cls.constants';
import { CLS_REQ, CLS_RES } from './cls.constants';
import { defaultNamespaceName, getNamespaceToken } from './cls.globals';
import type { ClsMiddlewareOptions } from './cls.module';
import { ClsService } from './cls.service';

@Injectable()
export class ClsMiddleware implements NestMiddleware {
    private readonly cls: ClsService;
    constructor(
        @Inject(CLS_MIDDLEWARE_OPTIONS) options: ClsMiddlewareOptions,
        moduleRef: ModuleRef,
    ) {
        this.cls = moduleRef.get(
            options.namespace === defaultNamespaceName
                ? ClsService
                : getNamespaceToken(options.namespace),
        );
    }
    use(req: any, res: any, next: () => any) {
        this.cls.runAndReturn(() => {
            this.cls.set(CLS_REQ, req);
            this.cls.set(CLS_RES, res);
            next();
        });
    }
}
