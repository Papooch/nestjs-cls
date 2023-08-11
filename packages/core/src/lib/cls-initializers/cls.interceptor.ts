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
import { ClsService } from '../cls.service';

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
        const clsStore = this.createOrReuseStore(context, cls);
        return new Observable((subscriber) => {
            cls.runWith(clsStore, async () => {
                if (this.options.generateId) {
                    const id = await this.options.idGenerator?.(context);
                    cls.setIfUndefined<any>(CLS_ID, id);
                }
                if (this.options.setup) {
                    await this.options.setup(cls, context);
                }
                try {
                    if (this.options.resolveProxyProviders)
                        await cls.resolveProxyProviders();
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

    createOrReuseStore(context: ExecutionContext, cls: ClsService) {
        let store = (cls.isActive() && cls.get()) || {};
        // NestJS triggers the interceptor for all queries within the same
        // call individually, so each query would be wrapped in a different
        // CLS context.
        // The solution is to store the CLS store in the GQL context and re-use
        // it each time the interceptor is triggered within the same request.
        if ((context.getType() as string) == 'graphql') {
            const gqlContext = context.getArgByIndex(2);
            if (!gqlContext.__CLS_STORE__) {
                gqlContext.__CLS_STORE__ = store;
            } else {
                store = gqlContext.__CLS_STORE__;
            }
        }
        return store;
    }
}
