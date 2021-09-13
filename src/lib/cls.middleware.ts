import { Injectable, NestMiddleware } from '@nestjs/common';
import { CLS_REQ, CLS_RES } from './cls.constants';
import { ClsService } from './cls.service';

@Injectable()
export class ClsMiddleware implements NestMiddleware {
    constructor(private readonly cls: ClsService) {}
    use(req: any, res: any, next: () => any) {
        this.cls.runAndReturn(() => {
            this.cls.set(CLS_REQ, req);
            this.cls.set(CLS_RES, res);
            next();
        });
    }
}
