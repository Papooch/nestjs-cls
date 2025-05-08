import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { isNonNullable } from '../../utils/is-non-nullable';
import { ClsServiceManager } from '../cls-service-manager';
import { ClsPluginHooks, ClsInitContext } from './cls-plugin.interface';
import { isPluginHooksToken } from './cls-plugin-base';

/**
 * This class gathers all the plugin hooks registered in the DI
 * and makes them available to the CLS-initializers (Cls-Middleware, -Guard, -Interceptor)
 * via a singleton instance.
 */
@Injectable()
export class ClsPluginsHooksHost implements OnModuleInit {
    private beforeSetupHooks!: Required<ClsPluginHooks>['beforeSetup'][];
    private afterSetupHooks!: Required<ClsPluginHooks>['afterSetup'][];
    private readonly cls = ClsServiceManager.getClsService();

    private static _instance: ClsPluginsHooksHost;
    static getInstance(): ClsPluginsHooksHost {
        if (!this._instance) {
            throw new Error('ClsPluginsHooksHost not initialized');
        }
        return this._instance;
    }

    constructor(private readonly discoveryService: DiscoveryService) {
        ClsPluginsHooksHost._instance = this;
    }

    onModuleInit() {
        const hooks = this.discoveryService
            .getProviders()
            .filter((p) => isPluginHooksToken(p.name))
            .map((p) => p.instance);

        this.beforeSetupHooks = hooks
            .map((hook) => hook.beforeSetup)
            .filter(isNonNullable);
        this.afterSetupHooks = hooks
            .map((hook) => hook.afterSetup)
            .filter(isNonNullable);
    }

    async beforeSetup(context: ClsInitContext) {
        for (const hook of this.beforeSetupHooks) {
            await hook(this.cls, context);
        }
    }

    async afterSetup(context: ClsInitContext) {
        for (const hook of this.afterSetupHooks) {
            await hook(this.cls, context);
        }
    }
}
