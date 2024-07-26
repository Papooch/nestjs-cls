import { Injectable, SetMetadata } from '@nestjs/common';
import { CLS_PROXY_METADATA_KEY } from './proxy-provider.constants';

export type InjectableProxyMetadata = {
    /**
     * If true, accessing any property on this provider while it is unresolved will throw an exception.
     *
     * Otherwise, the application behaves as if accessing a property on an empty object.
     *
     * Default: false
     *
     * Note - setting this option again in the forRootAsync method will override the value set in the decorator.
     */
    strict?: boolean;
};

/**
 * Mark a Proxy provider with this decorator to distinguish it from regular NestJS singleton providers
 */
export function InjectableProxy(options: InjectableProxyMetadata = {}) {
    return (target: any) =>
        Injectable()(SetMetadata(CLS_PROXY_METADATA_KEY, options)(target));
}
