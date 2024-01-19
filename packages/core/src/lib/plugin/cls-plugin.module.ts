import { Global } from '@nestjs/common';
import { ClsPluginManager } from './cls-plugin-manager';
import { ClsPlugin } from './cls-plugin.interface';

@Global()
export class ClsPluginModule {
    static forRoot(plugins: ClsPlugin[] = []) {
        ClsPluginManager.add(plugins);
        const imports = ClsPluginManager.getPluginImports();
        const providers = ClsPluginManager.getPluginProviders();

        return {
            module: ClsPluginModule,
            imports: imports,
            providers: providers,
            exports: providers,
        };
    }

    async onModuleInit() {
        await ClsPluginManager.onModuleInit();
    }

    async onModuleDestroy() {
        await ClsPluginManager.onModuleDestroy();
    }
}
