import {
    Controller,
    Get,
    Injectable,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ClsService } from '../../src';
import { TestGuard } from '../common/test.guard';
import { TestInterceptor } from '../common/test.interceptor';

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
        this.cls.set('FROM_CONTROLLER', 'OK');
        return this.service.hello();
    }
}
