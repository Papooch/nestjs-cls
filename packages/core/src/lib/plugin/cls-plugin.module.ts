import { Global } from '@nestjs/common';
import { ClsPlugin } from './cls-plugin.interface';

export function createClsPluginModule(plugin: ClsPlugin) {
    @Global()
    class ClsPluginModule {
        static forRoot() {
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
