import {
    Injectable,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { MessageBody, SubscribeMessage } from '@nestjs/websockets';

import { ClsService } from '../../src';
import { TestException } from '../common/test.exception';
import { TestGuard } from '../common/test.guard';
import { TestInterceptor } from '../common/test.interceptor';
import { TestWsExceptionFilter } from './test-ws.filter';

@Injectable()
export class TestWebsocketService {
    constructor(private readonly cls: ClsService) {}

    async hello(data?: unknown) {
        return {
            fromGuard: this.cls.get('FROM_GUARD'),
            fromInterceptor: this.cls.get('FROM_INTERCEPTOR'),
            fromInterceptorAfter: this.cls.get('FROM_INTERCEPTOR'),
            fromGateway: this.cls.get('FROM_GATEWAY'),
            fromService: this.cls.getId(),
            data,
        };
    }
}

@Injectable()
@UseFilters(TestWsExceptionFilter)
export class TestWebsocketGateway {
    constructor(
        private readonly service: TestWebsocketService,
        private readonly cls: ClsService,
    ) {}

    @SubscribeMessage('hello')
    @UseGuards(TestGuard)
    @UseInterceptors(TestInterceptor)
    hello(@MessageBody() data: unknown) {
        this.cls.set('FROM_GATEWAY', this.cls.getId());
        return this.service.hello(data);
    }

    @UseInterceptors(TestInterceptor)
    @UseGuards(TestGuard)
    @SubscribeMessage('error')
    async error(@MessageBody() data: unknown) {
        this.cls.set('FROM_GATEWAY', this.cls.getId());
        const response = await this.service.hello(data);
        throw new TestException(response);
    }
}
