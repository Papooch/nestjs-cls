import { globalClsService } from "../cls-service.globals";
import { ProxyProviderManager } from "./proxy-provider-manager";

describe('ProxyProviderManager', () => {
    afterEach(() => ProxyProviderManager.reset())
    describe('createProxyProvider', () => {
        it('is defined', () => {
            expect(ProxyProviderManager.createProxyProvider).toBeDefined();
        });

        it('returns a provider', () => {
            const providerToken = Symbol("example-provider")

            expect(ProxyProviderManager.createProxyProvider({
                provide: providerToken,
                useFactory: () => ({}),
            })).toEqual(expect.objectContaining({
                provide: providerToken,
                useFactory: expect.any(Function),
            }));
        });

        describe("the provider factory", () => {
            it("allows access to the underlying provider properties", async () => {
                await globalClsService.run(
                    async () => {
                        const provider = {
                            key: "value",
                        }
                        const providerToken = Symbol("example-provider")
                        const { useFactory } = ProxyProviderManager.createProxyProvider({
                            provide: providerToken,
                            useFactory: () => provider
                        });

                        const instance = useFactory()

                        ProxyProviderManager.init()
                        await ProxyProviderManager.resolveProxyProviders()

                        expect(instance.key).toBe(provider.key)
                    }
                )
            });
            it("binds function properties", async () => {
                await globalClsService.run(
                    async () => {
                        const provider = {
                            fn() {
                                return this
                            }
                        }
                        const providerToken = Symbol("example-provider")
                        const { useFactory } = ProxyProviderManager.createProxyProvider({
                            provide: providerToken,
                            useFactory: () => provider
                        });

                        const instance = useFactory()

                        ProxyProviderManager.init()
                        await ProxyProviderManager.resolveProxyProviders()

                        expect(instance.fn()).toBe(provider)
                    }
                )
            });
            it("preserves properties on function properties", async () => {
                await globalClsService.run(
                    async () => {
                        const provider = {
                            fn: Object.assign(() => "hello", { info: () => null })
                        }
                        const providerToken = Symbol("example-provider")
                        const { useFactory } = ProxyProviderManager.createProxyProvider({
                            provide: providerToken,
                            useFactory: () => provider
                        });

                        const instance = useFactory()

                        ProxyProviderManager.init()
                        await ProxyProviderManager.resolveProxyProviders()

                        expect(instance.fn.info).toEqual(expect.any(Function))
                    }
                )
            });
        });
    });
});
