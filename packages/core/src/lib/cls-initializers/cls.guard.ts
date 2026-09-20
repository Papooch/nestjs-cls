import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
} from '@nestjs/common';
import { ClsServiceManager } from '../cls-service-manager.js';
import { CLS_CTX, CLS_ID } from '../cls.constants.js';
import { CLS_GUARD_OPTIONS } from '../cls.internal-constants.js';
import { ClsGuardOptions } from '../cls.options.js';
import { ClsEnhancerInitContext } from '../plugin/cls-plugin.interface.js';
import { ClsPluginsHooksHost } from '../plugin/cls-plugin-hooks-host.js';
import { ContextClsStoreMap } from './utils/context-cls-store-map.js';

@Injectable()
export class ClsGuard implements CanActivate {
    private readonly options: Omit<ClsGuardOptions, 'mount'>;

    constructor(
        @Inject(CLS_GUARD_OPTIONS)
        options: Omit<ClsGuardOptions, 'mount'> | undefined,
    ) {
        this.options = { ...new ClsGuardOptions(), ...options };
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const cls = ClsServiceManager.getClsService();
        const existingStore = ContextClsStoreMap.get(context);
        const pluginHooks = ClsPluginsHooksHost.getInstance();
        if (existingStore) {
            cls.enter({ ifNested: 'reuse' });
        } else {
            cls.enterWith({});
            ContextClsStoreMap.set(context, cls.get());
        }
        const pluginCtx: ClsEnhancerInitContext = {
            kind: 'guard',
            ctx: context,
        };
        if (this.options.initializePlugins) {
            await pluginHooks.beforeSetup(pluginCtx);
        }
        if (this.options.generateId) {
            const id = await this.options.idGenerator?.(context);
            cls.setIfUndefined<any>(CLS_ID, id);
        }
        if (this.options.saveCtx) {
            cls.set<ExecutionContext>(CLS_CTX, context);
        }
        if (this.options.setup) {
            await this.options.setup(cls, context);
        }
        if (this.options.initializePlugins) {
            await pluginHooks.afterSetup(pluginCtx);
        }
        if (this.options.resolveProxyProviders) {
            await cls.proxy.resolve();
        }
        return true;
    }
}
