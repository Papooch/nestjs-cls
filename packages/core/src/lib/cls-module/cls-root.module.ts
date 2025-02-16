import {
    CanActivate,
    DynamicModule,
    Global,
    Logger,
    MiddlewareConsumer,
    Module,
    NestInterceptor,
    NestModule,
    OnModuleInit,
    Provider,
    Type,
} from '@nestjs/common';
import {
    APP_GUARD,
    APP_INTERCEPTOR,
    HttpAdapterHost,
    ModuleRef,
} from '@nestjs/core';
import { ClsGuard } from '../cls-initializers/cls.guard';
import { ClsInterceptor } from '../cls-initializers/cls.interceptor';
import { ClsMiddleware } from '../cls-initializers/cls.middleware';
import {
    CLS_GUARD_OPTIONS,
    CLS_INTERCEPTOR_OPTIONS,
    CLS_MIDDLEWARE_OPTIONS,
    CLS_MODULE_OPTIONS,
} from '../cls.internal-constants';
import {
    ClsGuardOptions,
    ClsInterceptorOptions,
    ClsMiddlewareOptions,
    ClsModuleAsyncOptions,
    ClsModuleOptions,
} from '../cls.options';
import { ClsPluginManager } from '../plugin/cls-plugin-manager';
import { ProxyProviderManager } from '../proxy-provider/proxy-provider-manager';
import { ClsCommonModule } from './cls-common.module';
import { getMiddlewareMountPoint } from './middleware.utils';

/**
 * This module contains logic for configuring the CLS module in the root.
 */
@Global()
@Module({
    imports: [ClsCommonModule],
})
export class ClsRootModule implements NestModule, OnModuleInit {
    private static logger = new Logger('ClsModule');

    constructor(
        private readonly adapterHost: HttpAdapterHost,
        private readonly moduleRef: ModuleRef,
    ) {}

    configure(consumer: MiddlewareConsumer) {
        const options = this.moduleRef.get(CLS_MIDDLEWARE_OPTIONS);

        if (options.mount) {
            const adapter = this.adapterHost.httpAdapter;
            const mountPoint = getMiddlewareMountPoint(adapter);
            ClsRootModule.logger.debug(
                'Mounting ClsMiddleware to ' + mountPoint,
            );
            consumer.apply(ClsMiddleware).forRoutes(mountPoint);
        }
    }

    onModuleInit() {
        ProxyProviderManager.init();
    }

    /**
     * @internal
     * Called by ClsModule.forRoot.
     *
     */
    static forRoot(options?: ClsModuleOptions): DynamicModule {
        options = { ...new ClsModuleOptions(), ...options };
        const { providers, exports } = this.getProviders();
        ProxyProviderManager.reset(); // ensure that the proxy manager's state is clean
        const proxyProviders = this.createProxyClassProviders(
            options.proxyProviders,
        );

        return {
            module: ClsRootModule,
            imports: ClsPluginManager.registerPlugins(options.plugins),
            providers: [
                {
                    provide: CLS_MODULE_OPTIONS,
                    useValue: options,
                },
                ...providers,
                ...proxyProviders,
            ],
            exports: [...exports, ...proxyProviders.map((p) => p.provide)],
            global: false,
        };
    }

    /**
     * @internal
     * Called by ClsModule.forRootAsync.
     */
    static forRootAsync(asyncOptions: ClsModuleAsyncOptions): DynamicModule {
        const { providers, exports } = this.getProviders();
        ProxyProviderManager.reset(); // ensure that the proxy manager's state is clean
        const proxyProviders = this.createProxyClassProviders(
            asyncOptions.proxyProviders,
        );

        return {
            module: ClsRootModule,
            imports: [
                ...(asyncOptions.imports ?? []),
                ...ClsPluginManager.registerPlugins(asyncOptions.plugins),
            ],
            providers: [
                {
                    provide: CLS_MODULE_OPTIONS,
                    inject: asyncOptions.inject,
                    useFactory: asyncOptions.useFactory,
                },
                ...providers,
                ...proxyProviders,
            ],
            exports: [...exports, ...proxyProviders.map((p) => p.provide)],
            global: false,
        };
    }

    /**
     * @internal
     * Called by this modules's forRoot/Async abd ClsModule.forFeature
     */
    static createProxyClassProviders(proxyProviderClasses?: Array<Type>) {
        return (
            proxyProviderClasses?.map((providerClass) =>
                ProxyProviderManager.createProxyProvider({
                    useClass: providerClass,
                }),
            ) ?? []
        );
    }

    private static getProviders() {
        const providers: Provider[] = [
            {
                provide: CLS_MIDDLEWARE_OPTIONS,
                inject: [CLS_MODULE_OPTIONS],
                useFactory: this.clsMiddlewareOptionsFactory,
            },
            {
                provide: CLS_GUARD_OPTIONS,
                inject: [CLS_MODULE_OPTIONS],
                useFactory: this.clsGuardOptionsFactory,
            },
            {
                provide: CLS_INTERCEPTOR_OPTIONS,
                inject: [CLS_MODULE_OPTIONS],
                useFactory: this.clsInterceptorOptionsFactory,
            },
        ];
        const enhancerArr: Provider[] = [
            {
                provide: APP_GUARD,
                inject: [CLS_GUARD_OPTIONS],
                useFactory: this.clsGuardFactory,
            },
            {
                provide: APP_INTERCEPTOR,
                inject: [CLS_INTERCEPTOR_OPTIONS],
                useFactory: this.clsInterceptorFactory,
            },
        ];

        return {
            providers: providers.concat(...enhancerArr),
            exports: providers,
        };
    }

    private static clsMiddlewareOptionsFactory(
        options: ClsModuleOptions,
    ): ClsMiddlewareOptions {
        const clsMiddlewareOptions = {
            ...new ClsMiddlewareOptions(),
            ...options.middleware,
        };
        return clsMiddlewareOptions;
    }

    private static clsGuardOptionsFactory(
        options: ClsModuleOptions,
    ): ClsGuardOptions {
        const clsGuardOptions = {
            ...new ClsGuardOptions(),
            ...options.guard,
        };
        return clsGuardOptions;
    }

    private static clsInterceptorOptionsFactory(
        options: ClsModuleOptions,
    ): ClsInterceptorOptions {
        const clsInterceptorOptions = {
            ...new ClsInterceptorOptions(),
            ...options.interceptor,
        };
        return clsInterceptorOptions;
    }

    private static clsGuardFactory(options: ClsGuardOptions): CanActivate {
        if (options.mount) {
            ClsRootModule.logger.debug(
                'ClsGuard will be automatically mounted',
            );
            return new ClsGuard(options);
        }
        return {
            canActivate: () => true,
        };
    }

    private static clsInterceptorFactory(
        options: ClsInterceptorOptions,
    ): NestInterceptor {
        if (options.mount) {
            ClsRootModule.logger.debug(
                'ClsInterceptor will be automatically mounted',
            );
            return new ClsInterceptor(options);
        }
        return {
            intercept: (_, next) => next.handle(),
        };
    }
}
