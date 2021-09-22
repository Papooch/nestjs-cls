import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Inject,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Observable } from 'rxjs';
import { CLS_ID, CLS_INTERCEPTOR_OPTIONS } from './cls.constants';

import { getClsServiceToken } from './cls-service-manager';
import { ClsInterceptorOptions } from './cls.interfaces';
import { ClsService } from './cls.service';

@Injectable()
export class ClsInterceptor implements NestInterceptor {
    private readonly cls: ClsService;
    constructor(
        @Inject(CLS_INTERCEPTOR_OPTIONS)
        private readonly options: ClsInterceptorOptions,
        private readonly moduleRef: ModuleRef,
    ) {
        this.cls = this.moduleRef.get(
            getClsServiceToken(options.namespaceName),
        );
    }
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return this.cls.runAndReturn(() => {
            if (this.options.generateId)
                this.cls.set(CLS_ID, this.options.idGenerator(context));
            console.log('running ', this.cls);
            return next.handle();
        });
    }
}
