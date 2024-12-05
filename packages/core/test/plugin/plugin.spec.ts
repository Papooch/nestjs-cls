import { Test } from '@nestjs/testing';
import { ClsModule, ClsPlugin, ClsService } from '../../src';
import { NestFactory } from '@nestjs/core';
import { Controller, Get, Module } from '@nestjs/common';
import supertest from 'supertest';

function providerToken(name: string) {
    return `${name}ProviderToken`;
}

function pluginInitializedToken(name: string) {
    return `${name.toLocaleUpperCase()}_PLUGIN_INITIALIZED`;
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
        onClsInit: (cls) => {
            cls.set(pluginInitializedToken(name), true);
        },
        providers: [
            {
                provide: providerToken(name),
                useValue: 'valueFromPlugin',
            },
        ],
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

        await module.init();

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
        'should run onClsInit method for plugin with %s enhancer',
        async (enhancerName) => {
            const { plugin } = createDummyPlugin('onClsInit');

            @Controller()
            class TestController {
                constructor(private readonly cls: ClsService) {}
                @Get()
                get() {
                    return this.cls.get(pluginInitializedToken('onClsInit'));
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
                .expect('true');
            await module.close();
        },
    );

    it('should register plugin and run module lifecycle and onClsInit methods (registerPlugins)', async () => {
        const root = createDummyPlugin('root');
        const feature = createDummyPlugin('feature');

        @Controller()
        class TestController {
            constructor(private readonly cls: ClsService) {}
            @Get()
            get() {
                return (
                    this.cls.get(pluginInitializedToken('root')) &&
                    this.cls.get(pluginInitializedToken('feature'))
                );
            }
        }
        @Module({
            imports: [
                ClsModule.forRoot({
                    middleware: {
                        mount: true,
                    },
                    plugins: [root.plugin],
                }),
                ClsModule.registerPlugins([feature.plugin]),
            ],
            controllers: [TestController],
        })
        class TestAppModule {}

        const module = await NestFactory.create(TestAppModule);

        expect(root.watchers.initHasRun).toBe(false);
        expect(feature.watchers.initHasRun).toBe(false);

        await module.init();

        expect(root.watchers.initHasRun).toBe(true);
        expect(feature.watchers.initHasRun).toBe(true);

        expect(module.get(providerToken('root'))).toBe('valueFromPlugin');
        expect(module.get(providerToken('feature'))).toBe('valueFromPlugin');

        expect(root.watchers.destroyHasRun).toBe(false);
        expect(feature.watchers.destroyHasRun).toBe(false);

        await supertest(module.getHttpServer())
            .get('/')
            .expect(200)
            .expect('true');

        await module.close();

        expect(root.watchers.destroyHasRun).toBe(true);
        expect(feature.watchers.destroyHasRun).toBe(true);
    });
});
