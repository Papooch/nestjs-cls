import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsMiddleware } from '../../src/cls.middleware';
import { ClsModule } from '../../src/cls.module';
import { TestHttpController, TestHttpService } from './http.app';

@Module({
    imports: [ClsModule.register({ http: 'fastify' })],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestHttpApp {}

describe('Cls Module over HTTP', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestHttpApp],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    it('works', () => {
        return app
            .inject({
                method: 'GET',
                url: '/hello',
            })
            .then((res) => {
                expect(res.statusCode).toEqual(200);
                expect(res.payload).toEqual('Hello world');
            });
    });
});
