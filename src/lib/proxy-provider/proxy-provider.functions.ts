import {
    ClsModuleProxyFactoryProviderOptions,
    ClsModuleProxyProviderOptions,
    ProxyFactoryProvider,
    ProxyProvider,
} from './proxy-provider.interfaces';

export const isProxyFactoryProviderOptions = (
    provider: ClsModuleProxyProviderOptions,
): provider is ClsModuleProxyFactoryProviderOptions =>
    Reflect.has(provider, 'useFactory');

export const isProxyFactoryProvider = (
    provider: ProxyProvider,
): provider is ProxyFactoryProvider => Reflect.has(provider, 'useFactory');
