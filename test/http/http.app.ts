import {
    CallHandler,
    CanActivate,
    Controller,
    ExecutionContext,
    Get,
    Injectable,
    NestInterceptor,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from '../../src';

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

@Injectable()
export class TestHttpService {
    constructor(private readonly cls: ClsService) {}

    async hello() {
        return {
            fromController: this.cls.get('FROM_CONTROLLER'),
            fromInterceptor: this.cls.get('FROM_INTERCEPTOR'),
            fromGuard: this.cls.get('FROM_GUARD'),
        };
    }
}

@UseGuards(TestGuard)
@Controller('/')
export class TestHttpController {
    constructor(
        private readonly service: TestHttpService,
        private readonly cls: ClsService,
    ) {}

    @UseInterceptors(TestInterceptor)
    @Get('hello')
    hello() {
        this.cls.set('FROM_CONTROLLER', true);
        return this.service.hello();
    }
}
