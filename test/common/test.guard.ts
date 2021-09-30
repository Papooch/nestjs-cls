import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from '../../src';

@Injectable()
export class TestGuard implements CanActivate {
    constructor(private readonly cls: ClsService) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        this.cls.set('FROM_GUARD', 'OK');
        return this.cls.isActive();
    }
}
