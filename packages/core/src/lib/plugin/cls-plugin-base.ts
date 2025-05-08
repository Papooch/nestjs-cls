import { InjectionToken, Provider } from '@nestjs/common';
import { ClsPlugin, ClsPluginHooks } from './cls-plugin.interface';

/**
 * Extend this class to create a new ClsPlugin
 *
 * It contains the basic structure for a plugin, including
 * some helper methods for common operations.
 */
export abstract class ClsPluginBase implements ClsPlugin {
    imports: any[] = [];
    providers: Provider[] = [];
    exports: any[] = [];

    /**
     * @param name {@link ClsPlugin.name}
     */
    constructor(public readonly name: string) {}

    protected get hooksProviderToken() {
        return getPluginHooksToken(this.name);
    }

    /**
     * Register the plugin hooks provider
     *
     * This is a shorthand for manually registering a provider
     * that returns the plugin hooks object provided under
     * the `hooksProviderToken` token.
     *
     * @example
     * ```
     * this.registerHooks({
     *   inject: [OPTIONS],
     *   useFactory: (options: PluginOptions<any>): ClsPluginHooks => ({
     *     afterSetup: (cls: ClsService) => {
     *       cls.set('some-key', options.pluginData);
     *     }
     *   })
     * })
     * ```
     */
    protected registerHooks(opts: {
        inject?: InjectionToken<any>[];
        useFactory: (...args: any[]) => ClsPluginHooks;
    }) {
        this.providers.push({
            provide: this.hooksProviderToken,
            inject: opts.inject,
            useFactory: opts.useFactory,
        });
        this.exports.push(this.hooksProviderToken);
    }
}

export function getPluginHooksToken(name: string) {
    return `CLS_PLUGIN_HOOKS_${name}`;
}

export function isPluginHooksToken(token: string | symbol) {
    return typeof token === 'string' && token.startsWith('CLS_PLUGIN_HOOKS_');
}
