import {
    Controller,
    Get,
    Injectable,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ClsService } from '../../src';
import { TestException } from '../common/test.exception';
import { TestGuard } from '../common/test.guard';
import { TestInterceptor } from '../common/test.interceptor';
import { TestRestExceptionFilter } from './test-rest.filter';

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
@UseFilters(TestRestExceptionFilter)
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

    @UseInterceptors(TestInterceptor)
    @Get('error')
    async error() {
        this.cls.set('FROM_CONTROLLER', this.cls.getId());
        const response = await this.service.hello();
        throw new TestException(response);
    }
}
