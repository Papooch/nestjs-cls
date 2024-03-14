import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
} from '@nestjs/common';
import { ClsServiceManager } from '../cls-service-manager';
import { CLS_GUARD_OPTIONS, CLS_ID } from '../cls.constants';
import { ClsGuardOptions } from '../cls.options';
import { ContextClsStoreMap } from './utils/context-cls-store-map';

@Injectable()
export class ClsGuard implements CanActivate {
    private readonly options: Omit<ClsGuardOptions, 'mount'>;

    constructor(
        @Inject(CLS_GUARD_OPTIONS)
        options: Omit<ClsGuardOptions, 'mount'>,
    ) {
        this.options = { ...new ClsGuardOptions(), ...options };
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const cls = ClsServiceManager.getClsService();
        const existingStore = ContextClsStoreMap.get(context);
        if (existingStore) {
            cls.enter({ ifNested: 'reuse' });
        } else {
            cls.enterWith({});
            ContextClsStoreMap.set(context, cls.get());
        }
        if (this.options.generateId) {
            const id = await this.options.idGenerator?.(context);
            cls.setIfUndefined<any>(CLS_ID, id);
        }
        if (this.options.setup) {
            await this.options.setup(cls, context);
        }
        if (this.options.initializePlugins) {
            await cls.initializePlugins();
        }
        if (this.options.resolveProxyProviders) {
            await cls.resolveProxyProviders();
        }
        return true;
    }
}
