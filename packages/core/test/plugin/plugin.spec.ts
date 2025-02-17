import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import {
    ClsInitContext,
    ClsModule,
    ClsService,
    getPluginHooksToken,
    ClsPlugin,
    UseCls,
} from '../../src';

function providerToken(name: string) {
    return `${name}ProviderToken`;
}

function pluginBeforeSetupKey(name: string) {
    return `${name.toLocaleUpperCase()}_PLUGIN_BEFORE_SETUP`;
}
function pluginAfterSetupKey(name: string) {
    return `${name.toLocaleUpperCase()}_PLUGIN_AFTER_SETUP`;
}

function createDummyPlugin(name: string) {
    const watchers = {
        initHasRun: false,
        destroyHasRun: false,
    };
    const plugin: ClsPlugin = {
        name,
        onModuleInit: () => {
            watchers.initHasRun = true;
        },
        onModuleDestroy: () => {
            watchers.destroyHasRun = true;
        },
        providers: [
            {
                provide: providerToken(name),
                useValue: 'valueFromPlugin',
            },
            {
                provide: getPluginHooksToken(name),
                useValue: {
                    beforeSetup(cls: ClsService, ctx: ClsInitContext) {
                        cls.set(pluginBeforeSetupKey(name), ctx.kind);
                    },
                    afterSetup(cls: ClsService, ctx: ClsInitContext) {
                        cls.set(pluginAfterSetupKey(name), ctx.kind);
                    },
                },
            },
        ],
        exports: [getPluginHooksToken(name)],
    };
    return {
        plugin,
        watchers,
    };
}

describe('Plugins', () => {
    it('should register plugin and run module lifecycle methods', async () => {
        const { plugin, watchers } = createDummyPlugin('forRoot');
        const module = await Test.createTestingModule({
            imports: [
                ClsModule.forRoot({
                    middleware: {
                        mount: true,
                    },
                    plugins: [plugin],
                }),
            ],
        }).compile();
        expect(watchers.initHasRun).toBe(false);

        await module.createNestApplication().init();

        expect(watchers.initHasRun).toBe(true);
        expect(module.get(providerToken('forRoot'))).toBe('valueFromPlugin');
        expect(watchers.destroyHasRun).toBe(false);

        await module.close();

        expect(watchers.destroyHasRun).toBe(true);
    });

    it('should register plugin and run module lifecycle methods (async)', async () => {
        const { plugin, watchers } = createDummyPlugin('forRootAsync');
        const module = await Test.createTestingModule({
            imports: [
                ClsModule.forRootAsync({
                    useFactory: () => ({
                        middleware: {
                            mount: true,
                        },
                    }),
                    plugins: [plugin],
                }),
            ],
        }).compile();
        expect(watchers.initHasRun).toBe(false);

        await module.init();

        expect(watchers.initHasRun).toBe(true);
        expect(module.get(providerToken('forRootAsync'))).toBe(
            'valueFromPlugin',
        );
        expect(watchers.destroyHasRun).toBe(false);

        await module.close();

        expect(watchers.destroyHasRun).toBe(true);
    });

    it.each(['middleware', 'guard', 'interceptor'] as const)(
        'should run init hooks for plugin with %s enhancer',
        async (enhancerName) => {
            const { plugin } = createDummyPlugin('initHooks');

            @Controller()
            class TestController {
                constructor(private readonly cls: ClsService) {}
                @Get()
                get() {
                    return {
                        before: this.cls.get(pluginBeforeSetupKey('initHooks')),
                        after: this.cls.get(pluginAfterSetupKey('initHooks')),
                    };
                }
            }

            @Module({
                imports: [
                    ClsModule.forRoot({
                        [enhancerName]: {
                            mount: true,
                        },
                        plugins: [plugin],
                    }),
                ],
                controllers: [TestController],
            })
            class TestAppModule {}

            const module = await NestFactory.create(TestAppModule);

            await module.init();
            await supertest(module.getHttpServer())
                .get('/')
                .expect(200)
                .expect({
                    before: enhancerName,
                    after: enhancerName,
                });
            await module.close();
        },
    );

    it('should run init hooks method for plugin with UseCls', async () => {
        const { plugin } = createDummyPlugin('UseCls');

        @Controller()
        class TestController {
            constructor(private readonly cls: ClsService) {}
            @UseCls()
            @Get()
            async get() {
                return {
                    before: this.cls.get(pluginBeforeSetupKey('UseCls')),
                    after: this.cls.get(pluginAfterSetupKey('UseCls')),
                };
            }
        }

        @Module({
            imports: [
                ClsModule.forRoot({
                    plugins: [plugin],
                }),
            ],
            controllers: [TestController],
        })
        class TestAppModule {}

        const module = await NestFactory.create(TestAppModule);

        await module.init();
        await supertest(module.getHttpServer()).get('/').expect(200).expect({
            before: 'decorator',
            after: 'decorator',
        });
        await module.close();
    });
});
