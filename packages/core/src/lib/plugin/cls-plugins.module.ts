import { DynamicModule, Global } from '@nestjs/common';
import { ClsServiceManager } from '../cls-service-manager';
import {
    ClsInitContext,
    ClsPluginHooks,
    getPluginHooksToken,
    ClsPlugin,
} from './cls-plugin.interface';
import { createClsPluginModule } from './cls-plugin.module';
import { isNonNullable } from '../../utils/is-non-nullable';

export class ClsPluginsHooksHost {
    private readonly beforeSetupHooks: Required<ClsPluginHooks>['beforeSetup'][];
    private readonly afterSetupHooks: Required<ClsPluginHooks>['afterSetup'][];
    private readonly cls = ClsServiceManager.getClsService();

    constructor(hooks: ClsPluginHooks[]) {
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

@Global()
export class ClsPluginsModule {
    static register(plugins: ClsPlugin[]): DynamicModule {
        return {
            global: true,
            module: ClsPluginsModule,
            imports: plugins.map((plugin) => createClsPluginModule(plugin)),
            providers: [
                {
                    provide: ClsPluginsHooksHost,
                    inject: plugins.map((plugin) => ({
                        token: getPluginHooksToken(plugin.name),
                        optional: true,
                    })),
                    useFactory: (...hooks: ClsPluginHooks[]) => {
                        return new ClsPluginsHooksHost(
                            hooks.filter(isNonNullable),
                        );
                    },
                },
            ],
            exports: [ClsPluginsHooksHost],
        };
    }
}
