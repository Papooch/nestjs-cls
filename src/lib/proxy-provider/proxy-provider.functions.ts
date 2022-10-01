import { Injectable, SetMetadata } from '@nestjs/common';
import { CLS_PROXY_METADATA_KEY } from './proxy-provider.constants';
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

export const InjectableProxy = () => (target: any) =>
    Injectable()(SetMetadata(CLS_PROXY_METADATA_KEY, true)(target));
