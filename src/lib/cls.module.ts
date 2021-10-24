import {
    DynamicModule,
    Logger,
    MiddlewareConsumer,
    Module,
    NestModule,
    Provider,
} from '@nestjs/common';
import {
    APP_GUARD,
    APP_INTERCEPTOR,
    HttpAdapterHost,
    ModuleRef,
} from '@nestjs/core';
import { ClsServiceManager, getClsServiceToken } from './cls-service-manager';
import {
    CLS_GUARD_OPTIONS,
    CLS_INTERCEPTOR_OPTIONS,
    CLS_MIDDLEWARE_OPTIONS,
} from './cls.constants';
import { ClsGuard } from './cls.guard';
import { ClsInterceptor } from './cls.interceptor';
import {
    ClsGuardOptions,
    ClsInterceptorOptions,
    ClsMiddlewareOptions,
    ClsModuleOptions,
} from './cls.interfaces';

import { ClsMiddleware } from './cls.middleware';
import { ClsService } from './cls.service';

@Module({
    providers: [...ClsServiceManager.getClsServicesAsProviders()],
    exports: [...ClsServiceManager.getClsServicesAsProviders()],
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
            // we are running static import, so do not mount it
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

    static forFeature(namespaceName?: string): DynamicModule {
        const providers = ClsServiceManager.getClsServicesAsProviders().filter(
            (p) =>
                p.provide === getClsServiceToken(namespaceName) ||
                p.provide === ClsService,
        );
        return {
            module: ClsModule,
            providers,
            exports: providers,
        };
    }

    static register(options?: ClsModuleOptions): DynamicModule {
        options = { ...new ClsModuleOptions(), ...options };
        ClsServiceManager.addClsService(options.namespaceName);
        const clsMiddlewareOptions = {
            ...new ClsMiddlewareOptions(),
            ...options.middleware,
            namespaceName: options.namespaceName,
        };
        const clsGuardOptions = {
            ...new ClsGuardOptions(),
            ...options.guard,
            namespaceName: options.namespaceName,
        };
        const clsInterceptorOptions = {
            ...new ClsInterceptorOptions(),
            ...options.interceptor,
            namespaceName: options.namespaceName,
        };
        const providers: Provider[] = [
            ...ClsServiceManager.getClsServicesAsProviders(),
            {
                provide: CLS_MIDDLEWARE_OPTIONS,
                useValue: clsMiddlewareOptions,
            },
            {
                provide: CLS_GUARD_OPTIONS,
                useValue: clsGuardOptions,
            },
            {
                provide: CLS_INTERCEPTOR_OPTIONS,
                useValue: clsInterceptorOptions,
            },
        ];
        const enhancerArr = [];
        if (clsGuardOptions.mount) {
            enhancerArr.push({
                provide: APP_GUARD,
                useClass: ClsGuard,
            });
        }
        if (clsInterceptorOptions.mount) {
            enhancerArr.push({
                provide: APP_INTERCEPTOR,
                useClass: ClsInterceptor,
            });
        }

        return {
            module: ClsModule,
            providers: providers.concat(...enhancerArr),
            exports: providers,
            global: options.global,
        };
    }
}
