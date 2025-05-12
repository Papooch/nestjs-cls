import {
    BeforeApplicationShutdown,
    DynamicModule,
    Global,
    OnApplicationBootstrap,
    OnApplicationShutdown,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ClsPluginsHooksHost } from './cls-plugin-hooks-host';
import { ClsPlugin } from './cls-plugin.interface';

@Global()
export class ClsPluginsModule {
    static createPluginModules(plugins?: ClsPlugin[]): DynamicModule[] {
        return (
            plugins?.map((plugin) => this.createClsPluginModule(plugin)) ?? []
        );
    }

    static registerPluginHooks(): DynamicModule {
        return {
            module: ClsPluginsModule,
            global: true,
            imports: [DiscoveryModule],
            providers: [ClsPluginsHooksHost],
            exports: [ClsPluginsHooksHost],
        };
    }

    private static createClsPluginModule(plugin: ClsPlugin): DynamicModule {
        @Global()
        class ClsPluginModule
            implements
                OnModuleInit,
                OnModuleDestroy,
                OnApplicationBootstrap,
                OnApplicationShutdown,
                BeforeApplicationShutdown
        {
            static forRoot(): DynamicModule {
                return {
                    module: ClsPluginModule,
                    imports: plugin.imports,
                    providers: plugin.providers,
                    exports: plugin.exports,
                };
            }

            async onModuleInit() {
                await plugin.onModuleInit?.();
            }
            async onModuleDestroy() {
                await plugin.onModuleDestroy?.();
            }
            async onApplicationBootstrap() {
                await plugin.onApplicationBootstrap?.();
            }
            async onApplicationShutdown(signal?: string) {
                await plugin.onApplicationShutdown?.(signal);
            }
            async beforeApplicationShutdown(signal?: string) {
                await plugin.beforeApplicationShutdown?.(signal);
            }
        }

        return ClsPluginModule.forRoot();
    }
}
