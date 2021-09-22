import { Inject } from '@nestjs/common';
import { getClsServiceToken } from './cls-service-manager';

export const InjectCls = (namespace: string) =>
    Inject(getClsServiceToken(namespace));
