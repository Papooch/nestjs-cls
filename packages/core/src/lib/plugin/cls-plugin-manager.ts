import { globalClsService } from '../cls-service.globals';
import { ClsPlugin } from './cls-plugin.interface';
import { createClsPluginModule } from './cls-plugin.module';

export class ClsPluginManager {
    private static clsService = globalClsService;
    private static plugins: ClsPlugin[] = [];

    static registerPlugins(plugins: ClsPlugin[] = []) {
        this.plugins.push(...plugins);
        return plugins.map((plugin) => createClsPluginModule(plugin));
    }

    static getPlugins() {
        return this.plugins;
    }

    static async onClsInit() {
        for (const plugin of this.plugins) {
            await plugin.onClsInit?.(this.clsService);
        }
    }
}
