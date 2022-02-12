import { Catch, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import mercurius from 'mercurius';
import { ClsService } from '../../src';
import { TestException } from '../common/test.exception';

@Catch(TestException)
export class TestGqlExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly adapterHost: HttpAdapterHost,
        private readonly cls: ClsService,
    ) {}

    catch(exception: TestException) {
        const adapter = this.adapterHost.httpAdapter;

        exception.response.fromFilter = this.cls.getId();

        if (adapter.constructor.name === 'FastifyAdapter') {
            throw new mercurius.ErrorWithProps('AAA', {
                exception: {
                    response: {
                        ...exception.response,
                    },
                },
            });
        }

        return exception;
    }
}
