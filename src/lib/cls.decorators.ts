import { Inject, Injectable, SetMetadata } from '@nestjs/common';
import { ClsService } from './cls.service';
import { CLS_PROXY_METADATA_KEY } from './proxy-provider';

/**
 * Use to explicitly inject the ClsService
 */
export function InjectCls() {
    return Inject(ClsService);
}

/**
 * Mark a Proxy provider with this decorator to distinguis it from regular NestJS singleton providers
 */
export const InjectableProxy = () => (target: any) =>
    Injectable()(SetMetadata(CLS_PROXY_METADATA_KEY, true)(target));
