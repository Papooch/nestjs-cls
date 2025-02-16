import {
    ClsModuleProxyClassProviderOptions,
    ClsModuleProxyProviderOptions,
    ProxyClassProviderDefinition,
    ProxyProviderDefinition,
} from './proxy-provider.interfaces';

export const isProxyClassProviderOptions = (
    provider: ClsModuleProxyProviderOptions,
): provider is ClsModuleProxyClassProviderOptions =>
    Reflect.has(provider, 'useClass');

export const isProxyClassProvider = (
    provider: ProxyProviderDefinition,
): provider is ProxyClassProviderDefinition =>
    Reflect.has(provider, 'useClass');
