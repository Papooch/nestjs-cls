import {
    CallHandler,
    CanActivate,
    Controller,
    ExecutionContext,
    Get,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from '../../src';

@Injectable()
export class TestHttpService {
    constructor(private readonly cls: ClsService) {}

    async hello() {
        return this.cls.get('hello');
    }
}

@Controller('/')
export class TestHttpController {
    constructor(
        private readonly service: TestHttpService,
        private readonly cls: ClsService,
    ) {}

    @Get('hello')
    hello() {
        console.log('running ', this.cls);

        this.cls.set('hello', 'Hello world');
        return this.service.hello();
    }
}

@Injectable()
export class TestGuard implements CanActivate {
    constructor(private readonly cls: ClsService) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        this.cls.set('FROM_GUARD', true);
        return this.cls.isActive();
    }
}

@Injectable()
export class TestInterceptor implements NestInterceptor {
    constructor(private readonly cls: ClsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        this.cls.set('FROM_INTERCEPTOR', true);
        return next.handle();
    }
}
