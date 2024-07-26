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

describe('resolveProxyProviders', () => {
    let app: INestApplication;

    @InjectableProxy()
    class ProxyClassA {
        something = 'something';
    }

    @InjectableProxy()
    class ProxyClassB {
        somethingElse = 'somethingElse';
    }

    it('resolves all registered proxy providers when called without arguments', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            await cls.resolveProxyProviders();
            expect(app.get(ProxyClassA).something).toBe('something');
            expect(app.get(ProxyClassB).somethingElse).toBe('somethingElse');
        });
    });

    it('resolves does not resolve anything when not called', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            expect(app.get(ProxyClassA).something).toBeUndefined();
            expect(app.get(ProxyClassB).somethingElse).toBeUndefined();
        });
    });

    it('resolves only selected proxy providers if an array is passed', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            await cls.resolveProxyProviders([ProxyClassA]);
            expect(app.get(ProxyClassA).something).toBe('something');
            expect(app.get(ProxyClassB).somethingElse).toBeUndefined();
        });
    });

    it('throws when an unregistered injection token is passed', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA /* ProxyClassB */),
        ]);
        await cls.run(async () => {
            await expect(
                cls.resolveProxyProviders([ProxyClassB]),
            ).rejects.toThrowError(
                'Cannot resolve a Proxy provider for symbol "ProxyClassB", because it was not registered using "ClsModule.forFeature()" or "ClsModule.forFeatureAsync()".',
            );
        });
    });

    it('resolves the rest of proxy providers when called again without overriding already resolved ones', async () => {
        app = await createAndInitTestingApp([
            ClsModule.forFeature(ProxyClassA, ProxyClassB),
        ]);
        await cls.run(async () => {
            await cls.resolveProxyProviders([ProxyClassA]);
            app.get(ProxyClassA).something = 'somethingEdited';
            await cls.resolveProxyProviders();
            expect(app.get(ProxyClassB).somethingElse).toBe('somethingElse');
            expect(app.get(ProxyClassA).something).toBe('somethingEdited');
        });
    });
});
