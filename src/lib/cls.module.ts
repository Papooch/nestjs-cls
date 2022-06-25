import {
    CanActivate,
    DynamicModule,
    Logger,
    MiddlewareConsumer,
    Module,
    NestInterceptor,
    NestModule,
    Provider,
    Type,
    ValueProvider,
} from '@nestjs/common';
import {
    APP_GUARD,
    APP_INTERCEPTOR,
    HttpAdapterHost,
    ModuleRef,
} from '@nestjs/core';
import { ClsServiceManager, createProxyProvider } from './cls-service-manager';
import {
    CLS_GUARD_OPTIONS,
    CLS_INTERCEPTOR_OPTIONS,
    CLS_MIDDLEWARE_OPTIONS,
    CLS_MODULE_OPTIONS,
} from './cls.constants';
import { ClsGuard } from './cls.guard';
import { ClsInterceptor } from './cls.interceptor';
import {
    ClsGuardOptions,
    ClsInterceptorOptions,
    ClsMiddlewareOptions,
    ClsModuleAsyncOptions,
    ClsModuleOptions,
} from './cls.interfaces';
import { ClsMiddleware } from './cls.middleware';
import { ClsService } from './cls.service';

const clsServiceProvider: ValueProvider<ClsService> = {
    provide: ClsService,
    useValue: ClsServiceManager.getClsService(),
};

@Module({
    providers: [clsServiceProvider],
    exports: [clsServiceProvider],
})
export class ClsModule implements NestModule {
    constructor(
        private readonly adapterHost: HttpAdapterHost,
        private readonly moduleRef: ModuleRef,
    ) {}

    private static logger = new Logger(ClsModule.name);

    configure(consumer: MiddlewareConsumer) {
        let options: ClsMiddlewareOptions;
        try {
            // if CLS_MIDDLEWARE_OPTIONS provider is available
            // we are running configure, so we mount the middleware
            options = this.moduleRef.get(CLS_MIDDLEWARE_OPTIONS);
        } catch (e) {
            // we are running forFeature import, so do not mount it
            return;
        }

        const adapter = this.adapterHost.httpAdapter;
        let mountPoint = '*';
        if (adapter.constructor.name === 'FastifyAdapter') {
            mountPoint = '(.*)';
        }

        if (options.mount) {
            ClsModule.logger.debug('Mounting ClsMiddleware to ' + mountPoint);
            consumer.apply(ClsMiddleware).forRoutes(mountPoint);
        }
    }

    /**
     * Registers the `ClsService` provider in the module
     */
    static forFeature(): DynamicModule {
        const providers = [clsServiceProvider];
        return {
            module: ClsModule,
            providers,
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
            ClsModule.logger.debug('ClsGuard will be automatically mounted');
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
            ClsModule.logger.debug(
                'ClsInterceptor will be automatically mounted',
            );
            return new ClsInterceptor(options);
        }
        return {
            intercept: (_, next) => next.handle(),
        };
    }

    private static getProviders() {
        const providers: Provider[] = [
            clsServiceProvider,
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

    static register(options?: ClsModuleOptions): DynamicModule {
        options = { ...new ClsModuleOptions(), ...options };
        const { providers, exports } = this.getProviders();
        const proxyProviders =
            options.proxyProviders?.map(createProxyProvider) ?? [];

        return {
            module: ClsModule,
            providers: [
                {
                    provide: CLS_MODULE_OPTIONS,
                    useValue: options,
                },
                ...providers,
                ...proxyProviders,
            ],
            exports: [...exports, ...proxyProviders.map((p) => p.provide)],
            global: options.global,
        };
    }

    static registerAsync(asyncOptions: ClsModuleAsyncOptions): DynamicModule {
        const { providers, exports } = this.getProviders();

        return {
            module: ClsModule,
            imports: asyncOptions.imports,
            providers: [
                {
                    provide: CLS_MODULE_OPTIONS,
                    inject: asyncOptions.inject,
                    useFactory: asyncOptions.useFactory,
                },
                ...providers,
            ],
            exports,
            global: asyncOptions.global,
        };
    }
}
