import { Inject } from '@nestjs/common';
import { ClsService } from './cls.service.js';

/**
 * Use to explicitly inject the ClsService
 */
export function InjectCls() {
    return Inject(ClsService);
}
