import {
    DynamicModule,
    Logger,
    MiddlewareConsumer,
    Module,
    NestModule,
    Provider,
} from '@nestjs/common';
import { HttpAdapterHost, ModuleRef } from '@nestjs/core';
import { Namespace } from 'cls-hooked';
import { CLS_DEFAULT_NAMESPACE, CLS_MIDDLEWARE_OPTIONS } from './cls.constants';
import {
    getDefaultNamespace,
    getNamespaceToken,
    resolveNamespace,
    setDefaultNamespace,
} from './cls.globals';
import { ClsMiddleware } from './cls.middleware';
import { ClsService } from './cls.service';

export class ClsModuleOptions {
    mountMiddleware? = true;
    defaultNamespace? = CLS_DEFAULT_NAMESPACE;
    global? = false;
}

export class ClsMiddlewareOptions {
    namespace: string = CLS_DEFAULT_NAMESPACE;
}

@Module({})
export class ClsModule implements NestModule {
    constructor(
        private readonly adapterHost: HttpAdapterHost,
        private readonly moduleRef: ModuleRef,
    ) {}

    private static middlewareWildcard = '*';
    private static mountMiddleware = true;
    private static logger = new Logger(ClsModule.name);
    private static namespacedProviders: Map<any, Provider<ClsService>> =
        new Map();

    configure(consumer: MiddlewareConsumer) {
        try {
            // if CLS_MIDDLEWARE_OPTIONS provider is available
            // we are running forRoot, so we mount the middleware
            this.moduleRef.get(CLS_MIDDLEWARE_OPTIONS);
        } catch (e) {
            // we are running forFeature, so do not mount it again
            return;
        }

        const adapter = this.adapterHost.httpAdapter;
        switch (adapter.constructor.name) {
            case 'FastifyAdapter':
                ClsModule.logger.log(
                    'Setting up ClsMiddleware for FastifyAdapter',
                );
                ClsModule.middlewareWildcard = '(.*)';
                break;
            default:
                ClsModule.logger.log(
                    'Setting up ClsMiddleware for ExpressAdapter',
                );
                ClsModule.middlewareWildcard = '*';
        }

        if (ClsModule.mountMiddleware) {
            ClsModule.logger.debug(
                'Mounting ClsMiddleware to ' + ClsModule.middlewareWildcard,
            );
            consumer
                .apply(ClsMiddleware)
                .forRoutes(ClsModule.middlewareWildcard);
        }
    }

    private static addNamespacedProvider(name: string) {
        this.namespacedProviders.set(name, {
            provide: getNamespaceToken(name),
            useValue: new ClsService(resolveNamespace(name)),
        });
    }

    static forFeature(name: string): DynamicModule {
        this.addNamespacedProvider(name);
        return {
            module: ClsModule,
            providers: Array.from(this.namespacedProviders.values()),
            exports: Array.from(this.namespacedProviders.values()),
        };
    }

    static forRoot(options?: ClsModuleOptions): DynamicModule {
        options = { ...new ClsModuleOptions(), ...options };
        this.mountMiddleware = options.mountMiddleware;
        if (options.defaultNamespace !== CLS_DEFAULT_NAMESPACE) {
            setDefaultNamespace(options.defaultNamespace);
            this.addNamespacedProvider(options.defaultNamespace);
        }
        this.namespacedProviders.set(ClsService, {
            provide: ClsService,
            useValue: new ClsService(getDefaultNamespace()),
        });

        const clsMiddlewareOptions = new ClsMiddlewareOptions();
        clsMiddlewareOptions.namespace = options.defaultNamespace;
        const providers = [
            ...Array.from(this.namespacedProviders.values()),
            {
                provide: CLS_MIDDLEWARE_OPTIONS,
                useValue: clsMiddlewareOptions,
            },
        ];
        return {
            module: ClsModule,
            providers,
            exports: Array.from(this.namespacedProviders.values()),
            global: options.global,
        };
    }
}
