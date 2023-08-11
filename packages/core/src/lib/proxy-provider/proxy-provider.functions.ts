import {
    ClsModuleProxyClassProviderOptions,
    ClsModuleProxyProviderOptions,
    ProxyClassProvider,
    ProxyProvider,
} from './proxy-provider.interfaces';

export const isProxyClassProviderOptions = (
    provider: ClsModuleProxyProviderOptions,
): provider is ClsModuleProxyClassProviderOptions =>
    Reflect.has(provider, 'useClass');

export const isProxyClassProvider = (
    provider: ProxyProvider,
): provider is ProxyClassProvider => Reflect.has(provider, 'useClass');
