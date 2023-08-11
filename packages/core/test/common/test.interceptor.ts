import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ClsService } from '../../src';
import { wait } from './helpers';

@Injectable()
export class TestInterceptor implements NestInterceptor {
    constructor(private readonly cls: ClsService) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {
        this.cls.set('FROM_INTERCEPTOR', this.cls.getId());
        await wait(Math.random() * 1000);
        return next.handle().pipe(
            tap(() => {
                this.cls.set('FROM_INTERCEPTOR_AFTER', this.cls.getId());
            }),
        );
    }
}
