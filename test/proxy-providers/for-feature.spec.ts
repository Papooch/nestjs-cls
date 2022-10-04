import {
    INestApplication,
    Inject,
    Injectable,
    Module,
    ModuleMetadata,
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
            ...imports,
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
            await cls.run(async () => {
                await ClsServiceManager.resolveProxyProviders();
            });
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
            await cls.run(async () => {
                await ClsServiceManager.resolveProxyProviders();
            });
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

            const appPromise = createAndInitTestingApp([
                ClsModule.forFeature(ProxyClass),
            ]);
            await expect(appPromise).rejects.toThrow(
                ProxyProviderNotDecoratedException,
            );
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
                await expect(
                    ClsServiceManager.resolveProxyProviders(),
                ).rejects.toThrowError(
                    'Cannot create Proxy provider ProxyClass (?). The argument SomeClass at index [0] was not found in the ClsModule Context.',
                );
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
                await expect(
                    ClsServiceManager.resolveProxyProviders(),
                ).resolves.not.toThrow();
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
                await expect(
                    ClsServiceManager.resolveProxyProviders(),
                ).resolves.not.toThrow();
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
                await expect(
                    ClsServiceManager.resolveProxyProviders(),
                ).resolves.not.toThrow();
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
                await expect(
                    ClsServiceManager.resolveProxyProviders(),
                ).resolves.not.toThrow();
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
                }),
            ]);
            await cls.run(async () => {
                await expect(
                    ClsServiceManager.resolveProxyProviders(),
                ).resolves.not.toThrow();
                expect(app.get(TOKEN)()).toBeInstanceOf(SomeClass);
            });
        });
    });
});
