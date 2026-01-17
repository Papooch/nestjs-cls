import {
    Global,
    INestApplication,
    Module,
    ModuleMetadata,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule, ClsServiceManager, InjectableProxy } from '../../src';

class ProxyCreationCounter {
    proxyA = 0;
    proxyB = 0;
}
@Global()
@Module({
    providers: [ProxyCreationCounter],
    exports: [ProxyCreationCounter],
})
class CounterModule {}

async function createAndInitTestingApp(imports: ModuleMetadata['imports']) {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
            CounterModule,
            ClsModule.forRoot({ middleware: { mount: true } }),
            ...(imports ?? []),
        ],
    }).compile();
    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
}
const cls = ClsServiceManager.getClsService();

describe('resolveProxyProviders', () => {
    let app: INestApplication;

    @InjectableProxy()
    class ProxyClassA {
        something = 'something';
        constructor(private readonly counter: ProxyCreationCounter) {
            this.counter.proxyA++;
        }
    }

    @InjectableProxy()
    class ProxyClassB {
        somethingElse = 'somethingElse';
        constructor(private readonly counter: ProxyCreationCounter) {
            this.counter.proxyB++;
        }
    }

    it('resolves all registered proxy providers when called without arguments', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            await cls.proxy.resolve();
            expect(app.get(ProxyClassA).something).toBe('something');
            expect(app.get(ProxyClassB).somethingElse).toBe('somethingElse');
            expect(app.get(ProxyCreationCounter)).toEqual({
                proxyA: 1,
                proxyB: 1,
            });
        });
    });

    it('resolves does not resolve anything when not called', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            expect(app.get(ProxyClassA).something).toBeUndefined();
            expect(app.get(ProxyClassB).somethingElse).toBeUndefined();
            expect(app.get(ProxyCreationCounter)).toEqual({
                proxyA: 0,
                proxyB: 0,
            });
        });
    });

    it('resolves only selected proxy providers if an array is passed', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            await cls.proxy.resolve([ProxyClassA]);
            expect(app.get(ProxyClassA).something).toBe('something');
            expect(app.get(ProxyClassB).somethingElse).toBeUndefined();
            expect(app.get(ProxyCreationCounter)).toEqual({
                proxyA: 1,
                proxyB: 0,
            });
        });
    });

    it('throws when an unregistered injection token is passed', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA /* ProxyClassB */),
        ]);
        await cls.run(async () => {
            await expect(cls.proxy.resolve([ProxyClassB])).rejects.toThrow(
                'Cannot resolve a Proxy provider for symbol "ProxyClassB", because it was not registered using "ClsModule.forFeature()" or "ClsModule.forFeatureAsync()".',
            );
        });
    });

    it('resolves the rest of proxy providers when called again without overriding already resolved ones', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            await cls.proxy.resolve([ProxyClassA]);
            app.get(ProxyClassA).something = 'somethingEdited';
            await cls.proxy.resolve();
            expect(app.get(ProxyClassB).somethingElse).toBe('somethingElse');
            expect(app.get(ProxyClassA).something).toBe('somethingEdited');
            expect(app.get(ProxyCreationCounter)).toEqual({
                proxyA: 1,
                proxyB: 1,
            });
        });
    });

    it('resolves proxy providers once per CLS context initialization', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            await cls.proxy.resolve();
        });
        await cls.run(async () => {
            await cls.proxy.resolve();
            await cls.proxy.resolve();
        });
        await cls.run(async () => {
            await cls.proxy.resolve([ProxyClassA]);
        });
        expect(app.get(ProxyCreationCounter)).toEqual({
            proxyA: 3,
            proxyB: 2,
        });
    });

    it('resolves proxy providers only once even with concurrent calls to resolveProxyProviders', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            await Promise.all([
                cls.proxy.resolve(),
                cls.proxy.resolve(),
                cls.proxy.resolve(),
            ]);
            expect(app.get(ProxyClassA).something).toBe('something');
            expect(app.get(ProxyClassB).somethingElse).toBe('somethingElse');
            expect(app.get(ProxyCreationCounter)).toEqual({
                proxyA: 1,
                proxyB: 1,
            });
        });
    });
});
