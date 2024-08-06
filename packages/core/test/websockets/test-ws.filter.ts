import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WebSocket } from 'ws';
import { ClsService } from '../../src';
import { TestException } from '../common/test.exception';

@Catch(TestException)
export class TestWsExceptionFilter implements ExceptionFilter {
    constructor(private readonly cls: ClsService) {}

    catch(exception: TestException, host: ArgumentsHost) {
        const client = host.switchToWs().getClient<WebSocket>();
        const response = {
            ...exception.response,
            fromFilter: this.cls.getId(),
        };
        client.send(JSON.stringify(response));
    }
}
