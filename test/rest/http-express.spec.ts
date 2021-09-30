import {
    INestApplication,
    MiddlewareConsumer,
    Module,
    NestModule,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ClsMiddleware, ClsModule } from '../../src';
import { TestHttpController, TestHttpService } from './http.app';

@Module({
    imports: [ClsModule.register({ middleware: { mount: true } })],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestAppWithAutoBoundMiddleware {}

@Module({
    imports: [ClsModule.register()],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestAppWithManuallyBoundMiddleware implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ClsMiddleware).forRoutes('*');
    }
}

@Module({
    imports: [ClsModule.register()],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestAppWithoutMiddleware {}

let app: INestApplication;
describe('Http Express App - Auto bound Middleware', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppWithAutoBoundMiddleware],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('works with middleware', () => {
        return request(app.getHttpServer()).get('/hello').expect(200).expect({
            fromGuard: 'OK',
            fromInterceptor: 'OK',
            fromController: 'OK',
        });
    });
});
describe('Http Express App - Manually bound Middleware in AppModule', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppWithManuallyBoundMiddleware],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('works with middleware', () => {
        return request(app.getHttpServer()).get('/hello').expect(200).expect({
            fromGuard: 'OK',
            fromInterceptor: 'OK',
            fromController: 'OK',
        });
    });
});
describe('Http Express App - Manually bound Middleware in Bootstrap', () => {
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppWithManuallyBoundMiddleware],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.use(new ClsMiddleware().use);
        await app.init();
    });

    it('works with middleware', () => {
        return request(app.getHttpServer()).get('/hello').expect(200).expect({
            fromGuard: 'OK',
            fromInterceptor: 'OK',
            fromController: 'OK',
        });
    });
});
