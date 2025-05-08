import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import {
    ClsInitContext,
    ClsModule,
    ClsService,
    ClsPlugin,
    UseCls,
    getPluginHooksToken,
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
        onModuleInit() {
            watchers.initHasRun = true;
        },
        onModuleDestroy() {
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
    describe('When plugins are passed via the root method only', () => {
        it('should register a single plugin and run module lifecycle methods', async () => {
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
            expect(module.get(providerToken('forRoot'))).toBe(
                'valueFromPlugin',
            );
            expect(watchers.destroyHasRun).toBe(false);

            await module.close();

            expect(watchers.destroyHasRun).toBe(true);
        });

        it('should register two plugins and run module lifecycle methods', async () => {
            const p1 = createDummyPlugin('forRoot1');
            const p2 = createDummyPlugin('forRoot2');
            const module = await Test.createTestingModule({
                imports: [
                    ClsModule.forRoot({
                        middleware: {
                            mount: true,
                        },
                        plugins: [p1.plugin, p2.plugin],
                    }),
                ],
            }).compile();
            expect(p1.watchers.initHasRun).toBe(false);
            expect(p2.watchers.initHasRun).toBe(false);

            await module.createNestApplication().init();

            expect(p1.watchers.initHasRun).toBe(true);
            expect(p2.watchers.initHasRun).toBe(true);
            expect(module.get(providerToken('forRoot1'))).toBe(
                'valueFromPlugin',
            );
            expect(module.get(providerToken('forRoot2'))).toBe(
                'valueFromPlugin',
            );
            expect(p1.watchers.destroyHasRun).toBe(false);
            expect(p2.watchers.destroyHasRun).toBe(false);

            await module.close();

            expect(p1.watchers.destroyHasRun).toBe(true);
            expect(p2.watchers.destroyHasRun).toBe(true);
        });

        it('should register a single plugin and run module lifecycle methods (async)', async () => {
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

        it('should register two plugins and run module lifecycle methods (async)', async () => {
            const p1 = createDummyPlugin('forRootAsync1');
            const p2 = createDummyPlugin('forRootAsync2');
            const module = await Test.createTestingModule({
                imports: [
                    ClsModule.forRootAsync({
                        useFactory: () => ({
                            middleware: {
                                mount: true,
                            },
                        }),
                        plugins: [p1.plugin, p2.plugin],
                    }),
                ],
            }).compile();
            expect(p1.watchers.initHasRun).toBe(false);
            expect(p2.watchers.initHasRun).toBe(false);

            await module.createNestApplication().init();

            expect(p1.watchers.initHasRun).toBe(true);
            expect(p2.watchers.initHasRun).toBe(true);
            expect(module.get(providerToken('forRootAsync1'))).toBe(
                'valueFromPlugin',
            );
            expect(module.get(providerToken('forRootAsync2'))).toBe(
                'valueFromPlugin',
            );
            expect(p1.watchers.destroyHasRun).toBe(false);
            expect(p2.watchers.destroyHasRun).toBe(false);

            await module.close();

            expect(p1.watchers.destroyHasRun).toBe(true);
            expect(p2.watchers.destroyHasRun).toBe(true);
        });

        it.each(['middleware', 'guard', 'interceptor'] as const)(
            'should run init hooks for plugins with %s enhancer',
            async (enhancerName) => {
                const { plugin: plugin1 } = createDummyPlugin('initHooks1');
                const { plugin: plugin2 } = createDummyPlugin('initHooks2');

                @Controller()
                class TestController {
                    constructor(private readonly cls: ClsService) {}
                    @Get()
                    get() {
                        return {
                            before1: this.cls.get(
                                pluginBeforeSetupKey('initHooks1'),
                            ),
                            before2: this.cls.get(
                                pluginBeforeSetupKey('initHooks2'),
                            ),
                            after1: this.cls.get(
                                pluginAfterSetupKey('initHooks1'),
                            ),
                            after2: this.cls.get(
                                pluginAfterSetupKey('initHooks2'),
                            ),
                        };
                    }
                }

                @Module({
                    imports: [
                        ClsModule.forRoot({
                            [enhancerName]: {
                                mount: true,
                            },
                            plugins: [plugin1, plugin2],
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
                        before1: enhancerName,
                        before2: enhancerName,
                        after1: enhancerName,
                        after2: enhancerName,
                    });
                await module.close();
            },
        );

        it('should run init hooks method for plugin with UseCls', async () => {
            const { plugin: plugin1 } = createDummyPlugin('UseCls1');
            const { plugin: plugin2 } = createDummyPlugin('UseCls2');

            @Controller()
            class TestController {
                constructor(private readonly cls: ClsService) {}
                @UseCls()
                @Get()
                async get() {
                    return {
                        before1: this.cls.get(pluginBeforeSetupKey('UseCls1')),
                        before2: this.cls.get(pluginBeforeSetupKey('UseCls2')),
                        after1: this.cls.get(pluginAfterSetupKey('UseCls1')),
                        after2: this.cls.get(pluginAfterSetupKey('UseCls2')),
                    };
                }
            }

            @Module({
                imports: [
                    ClsModule.forRoot({
                        plugins: [plugin1, plugin2],
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
                    before1: 'decorator',
                    before2: 'decorator',
                    after1: 'decorator',
                    after2: 'decorator',
                });
            await module.close();
        });
    });

    describe('When plugins are passed via the root method and via registerPlugins', () => {
        it('should register two plugins and run module lifecycle methods', async () => {
            const p1 = createDummyPlugin('forRoot1');
            const p2 = createDummyPlugin('forRoot2');
            const module = await Test.createTestingModule({
                imports: [
                    ClsModule.forRoot({
                        middleware: {
                            mount: true,
                        },
                        plugins: [p1.plugin],
                    }),
                    ClsModule.registerPlugins([p2.plugin]),
                ],
            }).compile();
            expect(p1.watchers.initHasRun).toBe(false);
            expect(p2.watchers.initHasRun).toBe(false);

            await module.createNestApplication().init();

            expect(p1.watchers.initHasRun).toBe(true);
            expect(p2.watchers.initHasRun).toBe(true);
            expect(module.get(providerToken('forRoot1'))).toBe(
                'valueFromPlugin',
            );
            expect(module.get(providerToken('forRoot2'))).toBe(
                'valueFromPlugin',
            );
            expect(p1.watchers.destroyHasRun).toBe(false);
            expect(p2.watchers.destroyHasRun).toBe(false);

            await module.close();

            expect(p1.watchers.destroyHasRun).toBe(true);
            expect(p2.watchers.destroyHasRun).toBe(true);
        });

        it('should register two plugins and run module lifecycle methods (async)', async () => {
            const p1 = createDummyPlugin('forRootAsync1');
            const p2 = createDummyPlugin('forRootAsync2');
            const module = await Test.createTestingModule({
                imports: [
                    ClsModule.forRootAsync({
                        useFactory: () => ({
                            middleware: {
                                mount: true,
                            },
                        }),
                        plugins: [p1.plugin],
                    }),
                    ClsModule.registerPlugins([p2.plugin]),
                ],
            }).compile();
            expect(p1.watchers.initHasRun).toBe(false);
            expect(p2.watchers.initHasRun).toBe(false);

            await module.createNestApplication().init();

            expect(p1.watchers.initHasRun).toBe(true);
            expect(p2.watchers.initHasRun).toBe(true);
            expect(module.get(providerToken('forRootAsync1'))).toBe(
                'valueFromPlugin',
            );
            expect(module.get(providerToken('forRootAsync2'))).toBe(
                'valueFromPlugin',
            );
            expect(p1.watchers.destroyHasRun).toBe(false);
            expect(p2.watchers.destroyHasRun).toBe(false);

            await module.close();

            expect(p1.watchers.destroyHasRun).toBe(true);
            expect(p2.watchers.destroyHasRun).toBe(true);
        });

        it.each(['middleware', 'guard', 'interceptor'] as const)(
            'should run init hooks for plugins with %s enhancer',
            async (enhancerName) => {
                const { plugin: plugin1 } = createDummyPlugin('initHooks1');
                const { plugin: plugin2 } = createDummyPlugin('initHooks2');

                @Controller()
                class TestController {
                    constructor(private readonly cls: ClsService) {}
                    @Get()
                    get() {
                        return {
                            before1: this.cls.get(
                                pluginBeforeSetupKey('initHooks1'),
                            ),
                            before2: this.cls.get(
                                pluginBeforeSetupKey('initHooks2'),
                            ),
                            after1: this.cls.get(
                                pluginAfterSetupKey('initHooks1'),
                            ),
                            after2: this.cls.get(
                                pluginAfterSetupKey('initHooks2'),
                            ),
                        };
                    }
                }

                @Module({
                    imports: [
                        ClsModule.forRoot({
                            [enhancerName]: {
                                mount: true,
                            },
                            plugins: [plugin1],
                        }),
                        ClsModule.registerPlugins([plugin2]),
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
                        before1: enhancerName,
                        before2: enhancerName,
                        after1: enhancerName,
                        after2: enhancerName,
                    });
                await module.close();
            },
        );

        it('should run init hooks method for plugin with UseCls', async () => {
            const { plugin: plugin1 } = createDummyPlugin('UseCls1');
            const { plugin: plugin2 } = createDummyPlugin('UseCls2');

            @Controller()
            class TestController {
                constructor(private readonly cls: ClsService) {}
                @UseCls()
                @Get()
                async get() {
                    return {
                        before1: this.cls.get(pluginBeforeSetupKey('UseCls1')),
                        before2: this.cls.get(pluginBeforeSetupKey('UseCls2')),
                        after1: this.cls.get(pluginAfterSetupKey('UseCls1')),
                        after2: this.cls.get(pluginAfterSetupKey('UseCls2')),
                    };
                }
            }

            @Module({
                imports: [
                    ClsModule.forRoot({
                        plugins: [plugin1],
                    }),
                    ClsModule.registerPlugins([plugin2]),
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
                    before1: 'decorator',
                    before2: 'decorator',
                    after1: 'decorator',
                    after2: 'decorator',
                });
            await module.close();
        });
    });
});
