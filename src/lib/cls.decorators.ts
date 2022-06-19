import { Inject } from '@nestjs/common';
import { getClsServiceToken } from './cls-service-manager';
import { CLS_DEFAULT_NAMESPACE } from './cls.constants';

/**
 * Use to explicitly inject the ClsService
 */
export function InjectCls(): (target: any, key: string | symbol, index?: number) => void;

/**
 * Use to inject a namespaced CLS service
 * @param namespace name of the namespace
 * @deprecated Namespace support will be removed in v3.0
 */
export function InjectCls(namespace: string): (target: any, key: string | symbol, index?: number) => void;
export function InjectCls(namespace = CLS_DEFAULT_NAMESPACE) {
    return Inject(getClsServiceToken(namespace));
}
