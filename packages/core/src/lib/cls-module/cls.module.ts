import { DynamicModule, Module, Type } from '@nestjs/common';
import { ClsModuleAsyncOptions, ClsModuleOptions } from '../cls.options';
import { ClsPluginManager } from '../plugin/cls-plugin-manager';

import { ClsPlugin } from '../plugin/cls-plugin.interface';
import { ProxyProviderManager } from '../proxy-provider/proxy-provider-manager';
import { ClsModuleProxyProviderOptions } from '../proxy-provider/proxy-provider.interfaces';
import { ClsCommonModule } from './cls-common.module';
import { ClsRootModule } from './cls-root.module';

/**
 * ClsModule is the main entry point for configuring the CLS module.
 */
@Module({
    imports: [ClsCommonModule],
    exports: [ClsCommonModule],
})
export class ClsModule {
    /**
     * Configures the CLS module for root.
     *
     * Provides the `ClsService` and registered Proxy Providers for injection.
     */
    static forRoot(options?: ClsModuleOptions): DynamicModule {
        return {
            module: ClsModule,
            imports: [ClsRootModule.forRoot(options)],
            global: options?.global,
        };
    }

    /**
     * Configures the CLS module in the root with asynchronously provided configuration.
     *
     * Provides the `ClsService` and registered Proxy Providers for injection.
     */
    static forRootAsync(asyncOptions: ClsModuleAsyncOptions): DynamicModule {
        return {
            module: ClsModule,
            imports: [ClsRootModule.forRootAsync(asyncOptions)],
            global: asyncOptions?.global,
        };
    }

    /**
     * Provides the `ClsService` for injection.
     */
    static forFeature(): DynamicModule;
    /**
     * Registers the given Class proxy providers in the module for injection along with `ClsService`.
     *
     * For advanced options, use `forFeatureAsync`.
     */
    static forFeature(...proxyProviderClasses: Array<Type>): DynamicModule;
    static forFeature(...proxyProviderClasses: Array<Type>): DynamicModule {
        const proxyProviders =
            ClsRootModule.createProxyClassProviders(proxyProviderClasses);
        return {
            module: ClsModule,
            providers: proxyProviders,
            exports: proxyProviders.map((p) => p.provide),
        };
    }

    /**
     * Registers the given Class or Factory proxy providers in the module along with `ClsService`.
     *
     * If used with `global: true`, makes the proxy provider available globally.
     */
    static forFeatureAsync(
        options: ClsModuleProxyProviderOptions,
    ): DynamicModule {
        const proxyProvider = ProxyProviderManager.createProxyProvider(options);
        const providers = [...(options.extraProviders ?? [])];
        return {
            module: ClsModule,
            imports: options.imports ?? [],
            providers: [...providers, proxyProvider],
            exports: [proxyProvider.provide],
            global: options.global,
        };
    }

    /**
     * Registers the given Plugins the module along with `ClsService`.
     */
    static registerPlugins(plugins: ClsPlugin[]): DynamicModule {
        return {
            module: ClsModule,
            imports: ClsPluginManager.registerPlugins(plugins),
        };
    }
}
