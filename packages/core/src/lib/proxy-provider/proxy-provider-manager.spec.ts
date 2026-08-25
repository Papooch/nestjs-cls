import { globalClsService } from '../cls-service.globals';
import { ProxyProviderInvalidReturnTypeException } from './proxy-provider.exceptions';
import { ProxyProviderManager } from './proxy-provider-manager';

describe('ProxyProviderManager', () => {
    afterEach(() => ProxyProviderManager.reset());
    describe('createProxyProvider', () => {
        it('is defined', () => {
            expect(ProxyProviderManager.createProxyProvider).toBeDefined();
        });

        it('returns a provider', () => {
            const providerToken = Symbol('example-provider');

            expect(
                ProxyProviderManager.createProxyProvider({
                    provide: providerToken,
                    useFactory: () => ({}),
                }),
            ).toEqual(
                expect.objectContaining({
                    provide: providerToken,
                    useFactory: expect.any(Function),
                }),
            );
        });

        describe('factory return type validation', () => {
            it.each([
                ['undefined', undefined],
                ['null', null],
                ['a string', 'hello'],
                ['a number', 42],
                ['a boolean', true],
            ])(
                'throws ProxyProviderInvalidReturnTypeException when factory returns %s',
                async (_, returnValue) => {
                    await globalClsService.run(async () => {
                        const providerToken = Symbol('example-provider');
                        const { useFactory } =
                            ProxyProviderManager.createProxyProvider({
                                provide: providerToken,
                                useFactory: () => returnValue as any,
                            });

                        useFactory();

                        ProxyProviderManager.init();
                        await expect(
                            ProxyProviderManager.resolveProxyProviders(),
                        ).rejects.toThrow(
                            ProxyProviderInvalidReturnTypeException,
                        );
                    });
                },
            );

            it('does not throw when factory returns an object', async () => {
                await globalClsService.run(async () => {
                    const providerToken = Symbol('example-provider');
                    const { useFactory } =
                        ProxyProviderManager.createProxyProvider({
                            provide: providerToken,
                            useFactory: () => ({ key: 'value' }),
                        });

                    useFactory();

                    ProxyProviderManager.init();
                    await expect(
                        ProxyProviderManager.resolveProxyProviders(),
                    ).resolves.not.toThrow();
                });
            });

            it('does not throw when factory returns a function', async () => {
                await globalClsService.run(async () => {
                    const providerToken = Symbol('example-provider');
                    const { useFactory } =
                        ProxyProviderManager.createProxyProvider({
                            provide: providerToken,
                            useFactory: () => () => 'result',
                            type: 'function',
                        });

                    useFactory();

                    ProxyProviderManager.init();
                    await expect(
                        ProxyProviderManager.resolveProxyProviders(),
                    ).resolves.not.toThrow();
                });
            });
        });

        describe('resolution tracking', () => {
            it('does not re-resolve an already-resolved provider in the same CLS context', async () => {
                await globalClsService.run(async () => {
                    let callCount = 0;
                    const providerToken = Symbol('example-provider');
                    const { useFactory } =
                        ProxyProviderManager.createProxyProvider({
                            provide: providerToken,
                            useFactory: () => {
                                callCount++;
                                return { value: callCount };
                            },
                        });

                    useFactory();

                    ProxyProviderManager.init();
                    await ProxyProviderManager.resolveProxyProviders();
                    await ProxyProviderManager.resolveProxyProviders();

                    // Factory should have only been called once
                    expect(callCount).toBe(1);
                });
            });
        });

        describe('the provider factory', () => {
            it('allows access to the underlying provider properties', async () => {
                await globalClsService.run(async () => {
                    const provider = {
                        key: 'value',
                    };
                    const providerToken = Symbol('example-provider');
                    const { useFactory } =
                        ProxyProviderManager.createProxyProvider({
                            provide: providerToken,
                            useFactory: () => provider,
                        });

                    const instance = useFactory();

                    ProxyProviderManager.init();
                    await ProxyProviderManager.resolveProxyProviders();

                    expect(instance.key).toBe(provider.key);
                });
            });
            it('binds function properties', async () => {
                await globalClsService.run(async () => {
                    const provider = {
                        fn() {
                            return this;
                        },
                    };
                    const providerToken = Symbol('example-provider');
                    const { useFactory } =
                        ProxyProviderManager.createProxyProvider({
                            provide: providerToken,
                            useFactory: () => provider,
                        });

                    const instance = useFactory();

                    ProxyProviderManager.init();
                    await ProxyProviderManager.resolveProxyProviders();

                    expect(instance.fn()).toBe(provider);
                });
            });
            it('preserves properties on function properties', async () => {
                await globalClsService.run(async () => {
                    const provider = {
                        fn: Object.assign(() => 'hello', { info: () => null }),
                    };
                    const providerToken = Symbol('example-provider');
                    const { useFactory } =
                        ProxyProviderManager.createProxyProvider({
                            provide: providerToken,
                            useFactory: () => provider,
                        });

                    const instance = useFactory();

                    ProxyProviderManager.init();
                    await ProxyProviderManager.resolveProxyProviders();

                    expect(instance.fn.info).toEqual(expect.any(Function));
                });
            });
        });
    });
});
