import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from '../../src';
import { expectOkIdsRest } from './expect-ids-rest';
import { TestHttpController, TestHttpService } from './http.app';

let app: INestApplication;

const optionsProvider = {
    provide: 'OPTIONS',
    useValue: {
        mount: true,
        generateId: true,
        setup: () => ({}),
        idGenerator: async () => Math.random(),
    },
};

@Module({
    providers: [optionsProvider],
    exports: [optionsProvider],
})
class OptionsModule {}
describe('Http Express App - Async Configuration', () => {
    it.each(['middleware', 'guard', 'interceptor'])(
        'works with for %s',
        async (what) => {
            @Module({
                imports: [
                    ClsModule.forRootAsync({
                        imports: [OptionsModule],
                        inject: ['OPTIONS'],
                        useFactory: (opts) => ({
                            [what]: opts,
                        }),
                    }),
                ],
                providers: [TestHttpService],
                controllers: [TestHttpController],
            })
            class TestAppWithAutoBoundMiddleware {}

            const moduleFixture: TestingModule = await Test.createTestingModule(
                {
                    imports: [TestAppWithAutoBoundMiddleware],
                },
            ).compile();
            app = moduleFixture.createNestApplication();
            await app.init();

            return expectOkIdsRest(app);
        },
    );
});
