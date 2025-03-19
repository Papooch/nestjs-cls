import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClsService } from '../../src';

@Injectable()
export class TestMiddleware implements NestMiddleware {
    constructor(private readonly cls: ClsService) {}

    use(_req: any, _res: any, next: (error?: any) => void) {
        this.cls.set('FROM_MIDDLEWARE', this.cls.getId());
        return next();
    }
}
