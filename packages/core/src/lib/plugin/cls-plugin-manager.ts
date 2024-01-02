import { globalClsService } from '../cls-service.globals';
import { ClsPlugin } from './cls-plugin.interface';

export class ClsPluginManager {
    private static clsService = globalClsService;
    private static plugins: ClsPlugin[] = [];

    static add(plugins: ClsPlugin[] = []) {
        this.plugins.push(...plugins);
    }

    static getPlugins() {
        return this.plugins;
    }

    static getPluginImports() {
        return this.plugins.flatMap((plugin) => plugin.imports ?? []);
    }

    static getPluginProviders() {
        return this.plugins.flatMap((plugin) => plugin.providers ?? []);
    }

    static async onClsInit() {
        for (const plugin of this.plugins) {
            await plugin.onClsInit?.(this.clsService);
        }
    }

    static async onModuleInit() {
        for (const plugin of this.plugins) {
            await plugin.onModuleInit?.();
        }
    }

    static async onModuleDestroy() {
        for (const plugin of this.plugins) {
            await plugin.onModuleDestroy?.();
        }
    }
}
