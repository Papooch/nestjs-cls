import { Catch, ExceptionFilter } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { ClsService } from '../../src';

@Catch(GraphQLError)
export class TestGqlExceptionFilter implements ExceptionFilter {
    constructor(private readonly cls: ClsService) {}

    catch(exception: GraphQLError) {
        return new GraphQLError(exception.message, {
            extensions: {
                exception: {
                    response: {
                        ...(exception.extensions as any).exception.response,
                        fromFilter: this.cls.getId(),
                    },
                },
            },
        });
    }
}
