import { DynamicModule, Global } from '@nestjs/common';
import { ClsPlugin } from './cls-plugin.interface';

export function createClsPluginModule(plugin: ClsPlugin): DynamicModule {
    @Global()
    class ClsPluginModule {
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
    }

    return ClsPluginModule.forRoot();
}
