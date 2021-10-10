import {
    Controller,
    Get,
    Injectable,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { identity } from 'rxjs';
import { ClsService, CLS_ID } from '../../src';
import { TestGuard } from '../common/test.guard';
import { TestInterceptor } from '../common/test.interceptor';

@Injectable()
export class TestHttpService {
    constructor(private readonly cls: ClsService) {}

    async hello() {
        return {
            fromGuard: this.cls.get('FROM_GUARD'),
            fromInterceptor: this.cls.get('FROM_INTERCEPTOR'),
            fromInterceptorAfter: this.cls.get('FROM_INTERCEPTOR'),
            fromController: this.cls.get('FROM_CONTROLLER'),
            fromService: this.cls.getId(),
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
        this.cls.set('FROM_CONTROLLER', this.cls.getId());
        return this.service.hello();
    }
}
