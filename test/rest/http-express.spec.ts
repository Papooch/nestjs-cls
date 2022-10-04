import {
    INestApplication,
    MiddlewareConsumer,
    Module,
    NestModule,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsMiddleware, ClsModule } from '../../src';
import { expectErrorIdsRest, expectOkIdsRest } from './expect-ids-rest';
import { TestHttpController, TestHttpService } from './http.app';

let app: INestApplication;
describe('Http Express App - Auto bound Middleware', () => {
    @Module({
        imports: [
            ClsModule.forRoot({
                middleware: { mount: true, generateId: true },
            }),
        ],
        providers: [TestHttpService],
        controllers: [TestHttpController],
    })
    class TestAppWithAutoBoundMiddleware {}

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppWithAutoBoundMiddleware],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it.each([
        ['OK', expectOkIdsRest],
        ['ERROR', expectErrorIdsRest],
    ])('works with %s response', (_, func: any) => {
        return func(app);
    });
});

describe('Http Express App - Manually bound Middleware in AppModule', () => {
    @Module({
        imports: [ClsModule.forRoot({ middleware: { generateId: true } })],
        providers: [TestHttpService],
        controllers: [TestHttpController],
    })
    class TestAppWithManuallyBoundMiddleware implements NestModule {
        configure(consumer: MiddlewareConsumer) {
            consumer.apply(ClsMiddleware).forRoutes('*');
        }
    }

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppWithManuallyBoundMiddleware],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it.each([
        ['OK', expectOkIdsRest],
        ['ERROR', expectErrorIdsRest],
    ])('works with %s response', (_, func: any) => {
        return func(app);
    });
});
describe('Http Express App - Manually bound Middleware in Bootstrap', () => {
    @Module({
        imports: [ClsModule.forRoot()],
        providers: [TestHttpService],
        controllers: [TestHttpController],
    })
    class TestAppWithoutMiddleware {}

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppWithoutMiddleware],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.use(new ClsMiddleware({ generateId: true }).use);
        await app.init();
    });

    it.each([
        ['OK', expectOkIdsRest],
        ['ERROR', expectErrorIdsRest],
    ])('works with %s response', (_, func: any) => {
        return func(app);
    });
});

describe('Http Express App - Auto bound Guard', () => {
    @Module({
        imports: [
            ClsModule.forRoot({
                guard: { mount: true, generateId: true },
            }),
        ],
        providers: [TestHttpService],
        controllers: [TestHttpController],
    })
    class TestAppWithAutoBoundGuard {}

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppWithAutoBoundGuard],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it.each([
        ['OK', expectOkIdsRest],
        ['ERROR', expectErrorIdsRest],
    ])('works with %s response', (_, func: any) => {
        return func(app);
    });

    it.each([
        ['OK', expectOkIdsRest],
        ['ERROR', expectErrorIdsRest],
    ])('does not leak context with %s response', (_, func: any) => {
        return Promise.all(Array(10).fill(app).map(func));
    });
});
describe('Http Express App - Auto bound Interceptor', () => {
    @Module({
        imports: [
            ClsModule.forRoot({
                interceptor: { mount: true, generateId: true },
            }),
        ],
        providers: [TestHttpService],
        controllers: [TestHttpController],
    })
    class TestAppWithAutoBoundInterceptor {}

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppWithAutoBoundInterceptor],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('works with OK response', () => {
        return expectOkIdsRest(app);
    });

    it('does not leak context', () => {
        return Promise.all(Array(10).fill(app).map(expectOkIdsRest));
    });
});
