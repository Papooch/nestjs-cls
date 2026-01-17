import { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule, ClsServiceManager, InjectableProxy } from '../../src';

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

describe('resolveProxyProviders - strict mode', () => {
    let app: INestApplication;

    afterEach(async () => {
        // this is necessary to check if the allowed keys work properly for the entire application lifecycle
        // for example, if the "onApplicationShutdown" property wasn't whitelisted, the app would crash on shutdown
        await app.close();
    });

    @InjectableProxy()
    class ProxyClass {
        something = 'something';
    }

    const ProxyToken = Symbol('ProxyToken');

    @InjectableProxy({ strict: true })
    class StrictProxyClass {
        something = 'something';
    }

    describe.each([
        [
            'class using forFeature',
            StrictProxyClass,
            StrictProxyClass.name,
            ClsModule.forFeature(StrictProxyClass),
        ],
        [
            'class using forFeatureAsync',
            ProxyClass,
            ProxyClass.name,
            ClsModule.forFeatureAsync({
                provide: ProxyClass,
                useClass: ProxyClass,
                strict: true,
            }),
        ],
        [
            'factory using forFeatureAsync',
            ProxyToken,
            ProxyToken.description,
            ClsModule.forFeatureAsync({
                provide: ProxyToken,
                useFactory: () => ({
                    something: 'something',
                }),
                strict: true,
            }),
        ],
    ])(
        'accessing properties on unresolved proxy providers (%s)',
        (_, ProviderToken, providerName, module) => {
            it('throws an error in strict mode', async () => {
                app = await createAndInitTestingApp([module]);

                await cls.run(async () => {
                    expect(() => app.get(ProviderToken).something).toThrow(
                        `Cannot access the property \"something\" on the Proxy provider ${providerName} because is has not been resolved yet and has been registered with the "strict: true" option. Make sure to call \"await cls.proxy.resolve()\" before accessing the Proxy provider`,
                    );
                });
            });

            it('does not throw an error in strict mode after is has been resolved', async () => {
                app = await createAndInitTestingApp([module]);

                await cls.run(async () => {
                    await cls.proxy.resolve();
                    expect(app.get(ProviderToken).something).toEqual(
                        'something',
                    );
                });
            });
        },
    );

    describe('calling an unresolved proxy provider as a function', () => {
        const FunctionProxyToken = Symbol('ProxyToken');

        const module = ClsModule.forFeatureAsync({
            provide: FunctionProxyToken,
            useFactory: () => () => 'something',
            type: 'function',
            strict: true,
        });

        it('throws an error in strict mode', async () => {
            app = await createAndInitTestingApp([module]);

            await cls.run(async () => {
                expect(() => app.get(FunctionProxyToken)()).toThrow(
                    `Cannot call the Proxy provider ${FunctionProxyToken.description} because is has not been resolved yet and has been registered with the "strict: true" option. Make sure to call "await cls.proxy.resolve()" before accessing the Proxy provider.`,
                );
            });
        });

        it('does not throw an error in strict mode after is has been resolved', async () => {
            app = await createAndInitTestingApp([module]);

            await cls.run(async () => {
                await cls.proxy.resolve();
                expect(app.get(FunctionProxyToken)()).toEqual('something');
            });
        });
    });
});
