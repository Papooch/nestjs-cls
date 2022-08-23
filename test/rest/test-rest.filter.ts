import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { ClsService } from '../../src';
import { TestException } from '../common/test.exception';

@Catch(TestException)
export class TestRestExceptionFilter implements ExceptionFilter {
    constructor(private readonly cls: ClsService) {}

    catch(exception: TestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        response.status(500).json({
            ...exception.response,
            fromFilter: this.cls.getId(),
        });
    }
}
