import { Injectable } from '@nestjs/common';
import { ClsService } from '../../../src';
import { Item } from './item.model';

@Injectable()
export class ItemService {
    constructor(private readonly cls: ClsService) {}

    async findAll(): Promise<Item[]> {
        const payload = [
            {
                id: this.cls.getId(),
                fromGuard: this.cls.get('FROM_GUARD'),
                fromInterceptor: this.cls.get('FROM_INTERCEPTOR'),
                fromInterceptorAfter: this.cls.get('FROM_INTERCEPTOR'),
                fromResolver: this.cls.get('FROM_RESOLVER'),
                fromService: this.cls.getId(),
            },
        ];
        return payload;
    }
}
