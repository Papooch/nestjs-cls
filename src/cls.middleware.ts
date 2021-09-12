import { Injectable, NestMiddleware } from '@nestjs/common';
import { ClsService } from './cls.service';

@Injectable()
export class ClsMiddleware implements NestMiddleware {
    constructor(private readonly cls: ClsService) {}
    use(req: any, res: any, next: () => any) {
        this.cls.run(() => next());
    }
}
