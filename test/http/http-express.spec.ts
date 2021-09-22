import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ClsModule } from '../../src';
import { TestHttpController, TestHttpService } from './http.app';

@Module({
    imports: [ClsModule.register({ middleware: { mount: true } })],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestAppWithBoundMiddleware {}

let app: INestApplication;
describe('Http Express App - Middleware', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppWithBoundMiddleware],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('works with middleware', () => {
        return request(app.getHttpServer()).get('/hello').expect(200).expect({
            fromGuard: true,
            fromInterceptor: true,
            fromController: true,
        });
    });
});
