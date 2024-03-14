import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsServiceManager } from '../cls-service-manager';
import { CLS_ID, CLS_INTERCEPTOR_OPTIONS } from '../cls.constants';
import { ClsInterceptorOptions } from '../cls.options';
import { ContextClsStoreMap } from './utils/context-cls-store-map';

@Injectable()
export class ClsInterceptor implements NestInterceptor {
    private readonly options: Omit<ClsInterceptorOptions, 'mount'>;

    constructor(
        @Inject(CLS_INTERCEPTOR_OPTIONS)
        options?: Omit<ClsInterceptorOptions, 'mount'>,
    ) {
        this.options = { ...new ClsInterceptorOptions(), ...options };
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const cls = ClsServiceManager.getClsService<any>();
        const clsStore = ContextClsStoreMap.get(context) ?? {};
        ContextClsStoreMap.set(context, clsStore);
        return new Observable((subscriber) => {
            cls.runWith(clsStore, async () => {
                if (this.options.generateId) {
                    const id = await this.options.idGenerator?.(context);
                    cls.setIfUndefined<any>(CLS_ID, id);
                }
                if (this.options.setup) {
                    await this.options.setup(cls, context);
                }
                if (this.options.initializePlugins) {
                    await cls.initializePlugins();
                }
                if (this.options.resolveProxyProviders) {
                    await cls.resolveProxyProviders();
                }
                try {
                    next.handle()
                        .pipe()
                        .subscribe({
                            next: (res) => subscriber.next(res),
                            error: (err) => subscriber.error(err),
                            complete: () => subscriber.complete(),
                        });
                } catch (e) {
                    subscriber.error(e);
                }
            });
        });
    }
}
