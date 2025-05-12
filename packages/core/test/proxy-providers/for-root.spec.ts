import {
    INestApplication,
    Inject,
    Injectable,
    Module,
    NestInterceptor,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Observable } from 'rxjs';
import {
    ClsModule,
    ClsModuleOptions,
    ClsService,
    ClsServiceManager,
    CLS_REQ,
    CLS_RES,
    InjectableProxy,
    CLS_CTX,
} from '../../src';
import { ProxyProviderNotDecoratedException } from '../../src/lib/proxy-provider/proxy-provider.exceptions';

async function createAndInitTestingApp(
    proxyProviders: ClsModuleOptions['proxyProviders'] = [],
    providers: any[] = [],
    imports: any[] = [],
    global = false,
) {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
            ClsModule.forRoot({
                middleware: { mount: true },
                proxyProviders,
                global,
            }),
            ...(imports ?? []),
        ],
        providers,
    }).compile();
    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
}
const cls = ClsServiceManager.getClsService();

describe('ClsModule', () => {
    let app: INestApplication;

    describe('forRoot', () => {
        it('provides a CLS_REQ and CLS_RES providers', async () => {
            app = await createAndInitTestingApp([]);
            expect(() => app.get(CLS_REQ)).not.toThrow();
            expect(() => app.get(CLS_RES)).not.toThrow();
        });

        it('provides a plain class proxy', async () => {
            @InjectableProxy()
            class ProxyClass {}

            app = await createAndInitTestingApp([ProxyClass]);
            expect(() => app.get(ProxyClass)).not.toThrow();
        });

        it('provides a class proxy that injects ClsService', async () => {
            @InjectableProxy()
            class ProxyClass {
                constructor(private cls: ClsService) {}
            }

            app = await createAndInitTestingApp([ProxyClass]);
            expect(() => app.get(ProxyClass)).not.toThrow();
            await cls.run(async () => {
                await cls.proxy.resolve();
            });
        });

        it('provides a class proxy that injects CLS_REQ and CLS_RES and CLS_CTX', async () => {
            @InjectableProxy()
            class ProxyClass {
                @Inject(CLS_CTX)
                context: any;

                constructor(
                    @Inject(CLS_REQ) private req: any,
                    @Inject(CLS_RES) private res: any,
                ) {}
            }

            app = await createAndInitTestingApp([ProxyClass]);
            expect(() => app.get(ProxyClass)).not.toThrow();
            await cls.run(async () => {
                await cls.proxy.resolve();
            });
        });

        it('provides multiple class proxies', async () => {
            @InjectableProxy()
            class ProxyClassOne {}

            @InjectableProxy()
            class ProxyClassTwo {}

            app = await createAndInitTestingApp([ProxyClassOne, ProxyClassTwo]);
            expect(() => app.get(ProxyClassOne)).not.toThrow();
            expect(() => app.get(ProxyClassTwo)).not.toThrow();
        });

        it('provides a class proxy and injects it into extra provider', async () => {
            @InjectableProxy()
            class ProxyClass {}

            @Injectable()
            class SomeClass {
                public proxy!: SomeClass;
            }

            app = await createAndInitTestingApp([ProxyClass], [SomeClass]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
            });
        });

        it('provides a class proxy to an interceptor', async () => {
            @InjectableProxy()
            class ProxyClass {}

            @Injectable()
            class SomeInterceptor implements NestInterceptor {
                constructor(public proxy: ProxyClass) {}
                intercept(): Observable<any> {
                    throw new Error('Method not implemented.');
                }
            }

            app = await createAndInitTestingApp(
                [ProxyClass],
                [{ provide: APP_INTERCEPTOR, useClass: SomeInterceptor }],
                [],
                true,
            );
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
            });
        });

        it('throws if class is not decorated with @InjectableProxy', async () => {
            @Injectable()
            class ProxyClass {
                prop = 'proxy';
            }

            const appPromise = createAndInitTestingApp([ProxyClass]);
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

            app = await createAndInitTestingApp([ProxyClass]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).rejects.toThrowError(
                    'Cannot create Proxy provider ProxyClass (?). The argument SomeClass at index [0] was not found in the ClsModule Context.',
                );
            });
        });

        it('throws if class proxy injects provider (using @Inject) that is not part of the module', async () => {
            @Injectable()
            class SomeClass {}

            @InjectableProxy()
            class ProxyClass {
                constructor(
                    @Inject(SomeClass)
                    private some: any,
                ) {}
            }

            app = await createAndInitTestingApp([ProxyClass]);
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).rejects.toThrowError(
                    'Cannot create Proxy provider ProxyClass (?). The argument SomeClass at index [0] was not found in the ClsModule Context.',
                );
            });
        });
    });

    describe('forRoot - global', () => {
        it("provides a class proxy to another module's provider", async () => {
            @InjectableProxy()
            class ProxyClass {}

            @Injectable()
            class SomeClass {
                constructor(public proxy: ProxyClass) {}
            }

            @Module({
                providers: [SomeClass],
                exports: [SomeClass],
            })
            class SomeModule {}

            app = await createAndInitTestingApp(
                [ProxyClass],
                [],
                [SomeModule],
                true,
            );
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
                expect(app.get(SomeClass).proxy).toBeInstanceOf(ProxyClass);
            });
        });

        it("provides a class proxy to another's module interceptor", async () => {
            @InjectableProxy()
            class ProxyClass {}

            @Injectable()
            class SomeInterceptor implements NestInterceptor {
                constructor(public proxy: ProxyClass) {}
                intercept(): Observable<any> {
                    throw new Error('Method not implemented.');
                }
            }

            @Module({
                providers: [
                    { provide: APP_INTERCEPTOR, useClass: SomeInterceptor },
                ],
            })
            class SomeModule {}

            app = await createAndInitTestingApp(
                [ProxyClass],
                [],
                [SomeModule],
                true,
            );
            await cls.run(async () => {
                await expect(cls.proxy.resolve()).resolves.not.toThrow();
            });
        });
    });
});
