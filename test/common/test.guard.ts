import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from '../../src';

@Injectable()
export class TestGuard implements CanActivate {
    constructor(private readonly cls: ClsService) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        if (this.cls.isActive()) this.cls.set('FROM_GUARD', this.cls.getId());
        return true;
    }
}
