import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from '../../src';

@Injectable()
export class TestInterceptor implements NestInterceptor {
    constructor(private readonly cls: ClsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        this.cls.set('FROM_INTERCEPTOR', 'OK');
        return next.handle();
    }
}
