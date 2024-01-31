import {
    Controller,
    Get,
    INestApplication,
    Inject,
    Injectable,
    Module,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ClsModule,
    ClsModuleOptions,
    ClsService,
    InjectableProxy,
} from '../../src';
import {
    expectOkIdsProxy,
    ProxyResult,
    ProxyResults,
} from './expect-ids-proxy';
import { globalClsService } from '../../src/lib/cls-service.globals';
import { ProxyProviderManager } from '../../src/lib/proxy-provider';

@Injectable()
class InjectedClass {
    property = 'injected prop';
}

@InjectableProxy()
class RequestScopedClass {
    id: string;
    requestScopedValue: string;

    constructor(
        private readonly cls: ClsService,
        private readonly injected: InjectedClass,
    ) {
        this.id = this.cls.getId();
    }

    getProperty() {
        return this.injected.property;
    }
}

const FACTORY_PROVIDER = 'FACTORY_PROVIDER';
function requestScopedFactory(injected: InjectedClass, cls: ClsService) {
    return {
        id: cls.getId(),
        getInjected: () => injected.property,
    };
}

function randomString() {
    return Math.random().toString(36).slice(-10);
}

@Controller()
class TestController {
    constructor(
        private readonly rsc: RequestScopedClass,
        @Inject(FACTORY_PROVIDER)
        private readonly rsf: Awaited<ReturnType<typeof requestScopedFactory>>,
    ) {}

    @Get('/hello')
    async getHello(): Promise<ProxyResults> {
        const controlValue = randomString();
        const beforeWait: ProxyResult = {
            rscId: this.rsc.id,
            rsfId: this.rsf.id,
            controlValue,
        };
        await new Promise((ok) => setTimeout(ok, Math.random() * 500));
        this.rsc.requestScopedValue = controlValue;
        await new Promise((ok) => setTimeout(ok, Math.random() * 500));
        const afterWait: ProxyResult = {
            rscId: this.rsc.id,
            rsfId: this.rsf.id,
            controlValue: this.rsc.requestScopedValue,
        };

        return {
            beforeWait,
            afterWait,
        };
    }
}

@Module({
    providers: [InjectedClass],
    exports: [InjectedClass],
})
class ImportedModule {}

async function getTestApp(forRoorOptions: ClsModuleOptions) {
    @Module({
        imports: [
            ClsModule.forRoot(forRoorOptions),
            ClsModule.forFeatureAsync({
                imports: [ImportedModule],
                useClass: RequestScopedClass,
            }),
            ClsModule.forFeatureAsync({
                provide: FACTORY_PROVIDER,
                imports: [ImportedModule],
                inject: [InjectedClass, ClsService],
                useFactory: requestScopedFactory,
            }),
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

describe('Proxy providers', () => {
    let app: INestApplication;

    it('works with middleware', async () => {
        app = await getTestApp({
            middleware: { mount: true, generateId: true },
        });
        await expectOkIdsProxy(app);
    });

    it('works with interceptor', async () => {
        app = await getTestApp({
            interceptor: { mount: true, generateId: true },
        });
        await expectOkIdsProxy(app);
    });

    it('works with guard', async () => {
        app = await getTestApp({
            interceptor: { mount: true, generateId: true },
        });
        await expectOkIdsProxy(app);
    });
});

describe('Edge cases', () => {
    it('proxy should allow setting falsy value', async () => {
        const clsService = globalClsService;
        const symbol = Symbol('testSymbol');
        const proxyProvider = ProxyProviderManager.createProxyProvider({
            provide: symbol,
            type: 'object',
            useFactory: () => ({
                booleanTest: true,
            }),
        });
        const proxy = proxyProvider.useFactory();
        await clsService.run(async () => {
            await ProxyProviderManager.resolveProxyProviders();
            expect(proxy.booleanTest).toBe(true);
            proxy.booleanTest = false;
            expect(proxy.booleanTest).toBe(false);
        });
    });
});
