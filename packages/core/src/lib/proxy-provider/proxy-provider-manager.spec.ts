import { ProxyProviderManager } from './proxy-provider-manager';
import { globalClsService } from '../cls-service.globals';

describe('Proxy provider manager', () => {
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
