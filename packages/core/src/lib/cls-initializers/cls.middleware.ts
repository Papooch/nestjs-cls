import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { ClsServiceManager } from '../cls-service-manager';
import { CLS_ID, CLS_REQ, CLS_RES } from '../cls.constants';
import { CLS_MIDDLEWARE_OPTIONS } from '../cls.internal-constants';
import { ClsMiddlewareOptions } from '../cls.options';
import { ClsMiddlewareInitContext } from '../plugin/cls-plugin.interface';
import { ClsPluginsHooksHost } from '../plugin/cls-plugin-hooks-host';
import { ContextClsStoreMap } from './utils/context-cls-store-map';

@Injectable()
export class ClsMiddleware implements NestMiddleware {
    private readonly options: Omit<ClsMiddlewareOptions, 'mount'>;

    constructor(
        @Inject(CLS_MIDDLEWARE_OPTIONS)
        options: Omit<ClsMiddlewareOptions, 'mount'> | undefined,
    ) {
        this.options = { ...new ClsMiddlewareOptions(), ...options };
    }
    use = async (req: any, res: any, next: (err?: any) => any) => {
        const cls = ClsServiceManager.getClsService();
        const pluginHooks = ClsPluginsHooksHost.getInstance();
        const callback = async () => {
            try {
                const pluginCtx: ClsMiddlewareInitContext = {
                    kind: 'middleware',
                    req,
                    res,
                };
                this.options.useEnterWith && cls.enter();
                ContextClsStoreMap.setByRaw(req, cls.get());
                if (this.options.initializePlugins) {
                    await pluginHooks.beforeSetup(pluginCtx);
                }
                if (this.options.generateId) {
                    const id = await this.options.idGenerator?.(req);
                    cls.setIfUndefined<any>(CLS_ID, id);
                }
                if (this.options.saveReq) cls.set<any>(CLS_REQ, req);
                if (this.options.saveRes) cls.set<any>(CLS_RES, res);
                if (this.options.setup) {
                    await this.options.setup(cls, req, res);
                }
                if (this.options.initializePlugins) {
                    await pluginHooks.afterSetup(pluginCtx);
                }
                if (this.options.resolveProxyProviders) {
                    await cls.resolveProxyProviders();
                }
                next();
            } catch (e) {
                next(e);
            }
        };
        const runner = this.options.useEnterWith
            ? cls.exit.bind(cls)
            : cls.run.bind(cls);
        runner(callback);
    };
}
