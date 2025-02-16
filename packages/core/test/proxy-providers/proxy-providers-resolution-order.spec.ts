import {
    Controller,
    INestApplication,
    Inject,
    Module,
    Post,
    Type,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import request from 'supertest';
import {
    CLS_REQ,
    ClsModule,
    ClsModuleProxyProviderOptions,
    InjectableProxy,
} from '../../src';

abstract class ValueProvider {
    abstract value: string;
}

async function getTestApp(
    providers: ClsModuleProxyProviderOptions[] = [],
    finalValueProviderClass: Type,
) {
    @Controller()
    class TestController {
        constructor(private readonly valueProvider: ValueProvider) {}

        @Post('hello')
        get() {
            return {
                value: this.valueProvider.value,
            };
        }
    }

    @Module({
        imports: [
            ClsModule.forRoot({
                global: true,
                middleware: {
                    mount: true,
                    saveReq: true,
                    saveRes: true,
                    resolveProxyProviders: true,
                },
            }),
            ...providers.map((p) =>
                ClsModule.forFeatureAsync({ ...p, global: true }),
            ),
        ],
        providers: [
            {
                provide: ValueProvider,
                useExisting: finalValueProviderClass,
            },
        ],
        controllers: [TestController],
    })
    class TestModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestModule],
    }).compile();
    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
}

describe('Injecting Proxy providers into each other', () => {
    let app: INestApplication;

    @InjectableProxy({ strict: true })
    class FirstOrderProxy implements ValueProvider {
        value: string;
        constructor(@Inject(CLS_REQ) request: Request) {
            this.value = `FirstOrderProxy: ${request.body.value}`;
        }
    }

    @InjectableProxy({ strict: true })
    class SecondOrderProxy implements ValueProvider {
        value: string;
        constructor(public readonly firstOrderProxy: FirstOrderProxy) {
            this.value = `SecondOrderProxy: ${firstOrderProxy.value}`;
        }
    }

    @InjectableProxy({ strict: true })
    class ThirdOrderProxy implements ValueProvider {
        value: string;
        constructor(public readonly secondOrderProxy: SecondOrderProxy) {
            this.value = `ThirdOrderProxy: ${secondOrderProxy.value}`;
        }
    }

    const classProxiesOptions = [
        {
            provide: FirstOrderProxy,
            useClass: FirstOrderProxy,
        },
        {
            provide: SecondOrderProxy,
            useClass: SecondOrderProxy,
        },
        {
            provide: ThirdOrderProxy,
            useClass: ThirdOrderProxy,
        },
    ] as const satisfies ClsModuleProxyProviderOptions[];

    const factoryProxiesOptions = [
        {
            provide: FirstOrderProxy,
            strict: true,
            inject: [CLS_REQ],
            useFactory: (request: Request): ValueProvider => ({
                value: `FirstOrderProxy: ${request.body.value}`,
            }),
        },
        {
            provide: SecondOrderProxy,
            strict: true,
            inject: [FirstOrderProxy],
            useFactory: (firstOrderProxy: FirstOrderProxy): ValueProvider => ({
                value: `SecondOrderProxy: ${firstOrderProxy.value}`,
            }),
        },
        {
            provide: ThirdOrderProxy,
            global: true,
            strict: true,
            inject: [SecondOrderProxy],
            useFactory: (
                secondOrderProxy: SecondOrderProxy,
            ): ValueProvider => ({
                value: `ThirdOrderProxy: ${secondOrderProxy.value}`,
            }),
        },
    ] as const satisfies ClsModuleProxyProviderOptions[];

    describe.each([
        [
            'First-order proxies (those that only inject default proxy providers)',
            1,
            'FirstOrderProxy:',
        ],
        [
            'Second-order proxies (those that inject user-defined proxy providers)',
            2,
            'SecondOrderProxy: FirstOrderProxy:',
        ],
        [
            'Third-order proxies (those that inject those that inject user-defined proxy providers)',
            3,
            'ThirdOrderProxy: SecondOrderProxy: FirstOrderProxy:',
        ],
    ])('%s', (_, order, prefix) => {
        it.each([
            ['Class Proxy Providers', classProxiesOptions],
            ['Factory Proxy Providers', factoryProxiesOptions],
        ])('work with %s', async (_, providers) => {
            app = await getTestApp(
                providers.slice(0, order),
                providers[order - 1].provide,
            );

            await request(app.getHttpServer())
                .post('/hello')
                .send({ value: 'value for test ' + order })
                .expect(201)
                .expect({
                    value: prefix + ' value for test ' + order,
                });
        });
    });

    describe('Third-order proxies (cont.)', () => {
        it.each([
            [
                'class, factory, class',
                [
                    classProxiesOptions[0],
                    factoryProxiesOptions[1],
                    classProxiesOptions[2],
                ],
            ],
            [
                'factory, class, factory',
                [
                    factoryProxiesOptions[0],
                    classProxiesOptions[1],
                    factoryProxiesOptions[2],
                ],
            ],
        ])('work with mixed Proxy Providers (%s)', async (_, providers) => {
            app = await getTestApp(providers.slice(0, 3), providers[2].provide);

            await request(app.getHttpServer())
                .post('/hello')
                .send({ value: 'value for mixed test' })
                .expect(201)
                .expect({
                    value: 'ThirdOrderProxy: SecondOrderProxy: FirstOrderProxy: value for mixed test',
                });
        });
    });
});
