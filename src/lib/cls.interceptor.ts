import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsServiceManager } from './cls-service-manager';
import { CLS_ID, CLS_INTERCEPTOR_OPTIONS } from './cls.constants';
import { ClsInterceptorOptions } from './cls.interfaces';

@Injectable()
export class ClsInterceptor implements NestInterceptor {
    constructor(
        @Inject(CLS_INTERCEPTOR_OPTIONS)
        private readonly options?: Omit<ClsInterceptorOptions, 'mount'>,
    ) {
        this.options = { ...new ClsInterceptorOptions(), ...options };
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const cls = ClsServiceManager.getClsService();
        return new Observable((subscriber) => {
            cls.run(async () => {
                if (this.options.generateId) {
                    const id = await this.options.idGenerator(context);
                    cls.set<any>(CLS_ID, id);
                }
                if (this.options.setup) {
                    await this.options.setup(cls, context);
                }
                try {
                    await ClsServiceManager.resolveProxyProviders();
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
