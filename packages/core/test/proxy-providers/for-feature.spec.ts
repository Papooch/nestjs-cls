import {
    INestApplication,
    Inject,
    Injectable,
    Module,
    ModuleMetadata,
    Optional,
    OptionalFactoryDependency,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ClsModule,
    ClsService,
    ClsServiceManager,
    CLS_REQ,
    CLS_RES,
    InjectableProxy,
} from '../../src';
import { ProxyProviderNotDecoratedException } from '../../src/lib/proxy-provider/proxy-provider.exceptions';

async function createAndInitTestingApp(imports: ModuleMetadata['imports']) {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
            ClsModule.forRoot({ middleware: { mount: true } }),
            ...(imports ?? []),
        ],
    }).compile();
    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
}
const cls = ClsServiceManager.getClsService();

describe('ClsModule', () => {
    let app: INestApplication;

    describe('forFeature', () => {
        it('provides a CLS_REQ and CLS_RES providers', async () => {
            app = await createAndInitTestingApp([ClsModule.forFeature()]);
            expect(() => app.get(CLS_REQ)).not.toThrow();
            expect(() => app.get(CLS_RES)).not.toThrow();
        });

        it('provides a plain class proxy', async () => {
            @InjectableProxy()
            class ProxyClass {}

            app = await createAndInitTestingApp([
                ClsModule.forFeature(ProxyClass),
            ]);
            expect(() => app.get(ProxyClass)).not.toThrow();
        });

        it('provides a class proxy that injects ClsService', async () => {
            @InjectableProxy()
            class ProxyClass {
                constructor(private cls: ClsService) {}
            }

            app = await createAndInitTestingApp([
                ClsModule.forFeature(ProxyClass),
            ]);
            expect(() => app.get(ProxyClass)).not.toThrow();
        });

        it('provides a class proxy that injects CLS_REQ and CLS_RES', async () => {
            @InjectableProxy()
            class ProxyClass {
                constructor(
                    @Inject(CLS_REQ) private req: any,
                    @Inject(CLS_RES) private res: any,
                ) {}
            }

            app = await createAndInitTestingApp([
                ClsModule.forFeature(ProxyClass),
            ]);
            expect(() => app.get(ProxyClass)).not.toThrow();
        });

        it('provides multiple class proxies', async () => {
            @InjectableProxy()
            class ProxyClassOne {}

            @InjectableProxy()
            class ProxyClassTwo {}

            app = await createAndInitTestingApp([
                ClsModule.forFeature(ProxyClassOne, ProxyClassTwo),
            ]);
            expect(() => app.get(ProxyClassOne)).not.toThrow();
            expect(() => app.get(ProxyClassTwo)).not.toThrow();
        });

        it('throws if class is not decorated with @InjectableProxy', async () => {
            @Injectable()
            class ProxyClass {
                prop = 'proxy';
            }

            const createApp = () =>
                createAndInitTestingApp([ClsModule.forFeature(ProxyClass)]);
            expect(createApp).toThrow(ProxyProviderNotDecoratedException);
        });

        it('throws if class proxy injects provider that is not part of the module', async () => {
            @Injectable()
            class SomeClass {}

            @InjectableProxy()
            class ProxyClass {
                constructor(private some: SomeClass) {}
            }

            app = await createAndInitTestingApp([
                ClsModule.forFeature(ProxyClass),
            ]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).rejects.toThrow(
                    'Cannot create Proxy provider ProxyClass (?). The argument SomeClass at index [0] was not found in the ClsModule Context.',
                );
            });
        });

        it('does not throw when class proxy has @Optional() dep that is missing', async () => {
            @Injectable()
            class SomeClass {
                value = 42;
            }

            @InjectableProxy()
            class ProxyClass {
                constructor(@Optional() public some?: SomeClass) {}
            }

            app = await createAndInitTestingApp([
                ClsModule.forFeature(ProxyClass),
            ]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
                expect(app.get(ProxyClass).some).toBeUndefined();
            });
        });

        it('injects the provider when @Optional() dep exists', async () => {
            @Injectable()
            class SomeClass {
                value = 42;
            }

            @InjectableProxy()
            class ProxyClass {
                constructor(@Optional() public some?: SomeClass) {}
            }

            app = await createAndInitTestingApp([
                ClsModule.forFeatureAsync({
                    extraProviders: [SomeClass],
                    useClass: ProxyClass,
                }),
            ]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
                expect(app.get(ProxyClass).some).toBeInstanceOf(SomeClass);
                expect(app.get(ProxyClass).some?.value).toBe(42);
            });
        });
    });

    describe('forFeatureAsync', () => {
        it('provides a class proxy with injected extra provider', async () => {
            @Injectable()
            class SomeClass {}

            @InjectableProxy()
            class ProxyClass {
                constructor(private some: SomeClass) {}
            }

            app = await createAndInitTestingApp([
                ClsModule.forFeatureAsync({
                    extraProviders: [SomeClass],
                    useClass: ProxyClass,
                }),
            ]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
            });
        });

        it('provides a class proxy with a provider from imported module', async () => {
            @Injectable()
            class SomeClass {}

            @Module({
                providers: [SomeClass],
                exports: [SomeClass],
            })
            class SomeModule {}

            @InjectableProxy()
            class ProxyClass {
                constructor(public some: SomeClass) {}
            }

            app = await createAndInitTestingApp([
                ClsModule.forFeatureAsync({
                    imports: [SomeModule],
                    useClass: ProxyClass,
                }),
            ]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
                expect(app.get(ProxyClass).some).toBeInstanceOf(SomeClass);
            });
        });

        it('provides a factory proxy', async () => {
            const TOKEN = 'PROXY';
            app = await createAndInitTestingApp([
                ClsModule.forFeatureAsync({
                    provide: TOKEN,
                    useFactory: () => ({
                        some: true,
                    }),
                }),
            ]);
            expect(() => app.get(TOKEN)).not.toThrow();
        });

        it('provides a factory proxy that injects ClsService', async () => {
            const TOKEN = 'PROXY';
            app = await createAndInitTestingApp([
                ClsModule.forFeatureAsync({
                    provide: TOKEN,
                    inject: [ClsService],
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    useFactory: (cls: ClsService) => ({
                        some: true,
                    }),
                }),
            ]);
            expect(() => app.get(TOKEN)).not.toThrow();
        });

        it('provides a factory proxy that injects CLS_REQ and CLS_RES', async () => {
            const TOKEN = 'PROXY';
            app = await createAndInitTestingApp([
                ClsModule.forFeatureAsync({
                    provide: TOKEN,
                    inject: [CLS_REQ, CLS_RES],
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    useFactory: (req: any, res: any) => ({
                        some: true,
                    }),
                }),
            ]);
            expect(() => app.get(TOKEN)).not.toThrow();
        });

        it('injects and provides a factory proxy', async () => {
            @Injectable()
            class SomeClass {}

            const TOKEN = 'PROXY';
            app = await createAndInitTestingApp([
                ClsModule.forFeatureAsync({
                    provide: TOKEN,
                    extraProviders: [SomeClass],
                    inject: [SomeClass],
                    useFactory: (some: SomeClass) => ({
                        some: some,
                    }),
                }),
            ]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
                expect(app.get(TOKEN).some).toBeInstanceOf(SomeClass);
            });
        });

        it('injects and provides an async factory proxy', async () => {
            @Injectable()
            class SomeClass {}

            const TOKEN = 'PROXY';
            app = await createAndInitTestingApp([
                ClsModule.forFeatureAsync({
                    provide: TOKEN,
                    extraProviders: [SomeClass],
                    inject: [SomeClass],
                    useFactory: async (some: SomeClass) => ({
                        some: await Promise.resolve(some),
                    }),
                }),
            ]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
                expect(app.get(TOKEN).some).toBeInstanceOf(SomeClass);
            });
        });

        it('injects and provides a factory proxy as a function', async () => {
            @Injectable()
            class SomeClass {}

            const TOKEN = 'PROXY';
            app = await createAndInitTestingApp([
                ClsModule.forFeatureAsync({
                    provide: TOKEN,
                    extraProviders: [SomeClass],
                    inject: [SomeClass],
                    useFactory: (some: SomeClass) => () => some,
                    type: 'function',
                }),
            ]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
                expect(typeof app.get(TOKEN)).toBe('function');
                expect(app.get(TOKEN)()).toBeInstanceOf(SomeClass);
            });
        });

        describe('OptionalFactoryDependency', () => {
            it('injects undefined when optional dep is missing', async () => {
                const MISSING_TOKEN = 'MISSING';
                const TOKEN = 'PROXY';
                const optDep: OptionalFactoryDependency = {
                    token: MISSING_TOKEN,
                    optional: true,
                };
                app = await createAndInitTestingApp([
                    ClsModule.forFeatureAsync({
                        provide: TOKEN,
                        inject: [optDep],
                        useFactory: (dep: unknown) => ({ dep }),
                    }),
                ]);
                await cls.run(async () => {
                    await expect(cls.proxy.resolve()).resolves.not.toThrow();
                    expect(app.get(TOKEN).dep).toBeUndefined();
                });
            });

            it('injects the provider when optional dep exists', async () => {
                @Injectable()
                class SomeClass {
                    value = 42;
                }

                const TOKEN = 'PROXY';
                const optDep: OptionalFactoryDependency = {
                    token: SomeClass,
                    optional: true,
                };
                app = await createAndInitTestingApp([
                    ClsModule.forFeatureAsync({
                        provide: TOKEN,
                        extraProviders: [SomeClass],
                        inject: [optDep],
                        useFactory: (dep: SomeClass) => ({ dep }),
                    }),
                ]);
                await cls.run(async () => {
                    await expect(cls.proxy.resolve()).resolves.not.toThrow();
                    expect(app.get(TOKEN).dep).toBeInstanceOf(SomeClass);
                    expect(app.get(TOKEN).dep.value).toBe(42);
                });
            });

            it('resolves proxy providers in correct order when optional dep is another proxy provider', async () => {
                const PROXY_A = 'PROXY_A_OPT';
                const PROXY_B = 'PROXY_B_OPT';
                let resolveOrder: string[] = [];

                const optDep: OptionalFactoryDependency = {
                    token: PROXY_A,
                    optional: true,
                };
                app = await createAndInitTestingApp([
                    // global: true makes PROXY_A injectable by PROXY_B's module
                    ClsModule.forFeatureAsync({
                        provide: PROXY_A,
                        global: true,
                        // async factory to ensure ordering matters (not just luck)
                        useFactory: async () => {
                            await new Promise((r) => setImmediate(r));
                            resolveOrder.push('A');
                            return { name: 'A' };
                        },
                    }),
                    ClsModule.forFeatureAsync({
                        provide: PROXY_B,
                        inject: [optDep],
                        useFactory: (a: { name: string }) => {
                            resolveOrder.push('B');
                            return { name: 'B', dep: a?.name };
                        },
                    }),
                ]);
                await cls.run(async () => {
                    resolveOrder = [];
                    await cls.proxy.resolve();
                    expect(resolveOrder[0]).toBe('A');
                    expect(resolveOrder[1]).toBe('B');
                    expect(app.get(PROXY_B).dep).toBe('A');
                });
            });
        });
    });
});
