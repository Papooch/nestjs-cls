import {
    DynamicModule,
    Logger,
    MiddlewareConsumer,
    Module,
    NestModule,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ClsMiddleware } from './cls.middleware';
import { ClsService } from './cls.service';

class ClsModuleOptions {
    mountMiddleware? = true;
}

@Module({})
export class ClsModule implements NestModule {
    constructor(private readonly adapterHost: HttpAdapterHost) {}

    private static middlewareWildcard = '*';
    private static mountMiddleware = true;
    private static logger = new Logger(ClsModule.name);

    configure(consumer: MiddlewareConsumer) {
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

    static register(options?: ClsModuleOptions): DynamicModule {
        options = { ...new ClsModuleOptions(), ...options };
        this.mountMiddleware = options.mountMiddleware;
        return {
            module: ClsModule,
            providers: [ClsService],
            exports: [ClsService],
        };
    }
}
