import { Module } from '@nestjs/common';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from '../../src';
import { TestHttpController, TestHttpService } from './http.app';

@Module({
    imports: [
        ClsModule.register({
            namespaceName: 'xxx',
            middleware: { mount: true },
        }),
    ],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestHttpApp {}

describe('Http Fastify App', () => {
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

    it('works with Fastify', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/hello',
        });
        expect(res.statusCode).toEqual(200);
        expect(res.payload).toEqual('Hello world');
    });
});
