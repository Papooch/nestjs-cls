import { Test } from '@nestjs/testing';
import { ClsModule, ClsPlugin, ClsService } from '../../src';
import { NestFactory } from '@nestjs/core';
import { Controller, Get, Module } from '@nestjs/common';
import supertest from 'supertest';

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
            cls.set('PLUGIN_INITIALIZED', true);
        },
        providers: [
            {
                provide: 'providerFromPlugin',
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
        expect(module.get('providerFromPlugin')).toBe('valueFromPlugin');
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
        expect(module.get('providerFromPlugin')).toBe('valueFromPlugin');
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
                    return this.cls.get('PLUGIN_INITIALIZED');
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
});
