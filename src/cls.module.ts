import {
    DynamicModule,
    MiddlewareConsumer,
    Module,
    NestModule,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ClsMiddleware } from './cls.middleware';
import { ClsService } from './cls.service';

class ClsModuleOptions {
    mountMiddleware? = true;
    http?: 'express' | 'fastify' = 'express';
}

@Module({})
export class ClsModule implements NestModule {
    private static middlewareWildcard = '*';
    private static mountMiddleware = true;

    configure(consumer: MiddlewareConsumer) {
        if (ClsModule.mountMiddleware)
            consumer
                .apply(ClsMiddleware)
                .forRoutes(ClsModule.middlewareWildcard);
    }

    static register(options: ClsModuleOptions): DynamicModule {
        options = { ...new ClsModuleOptions(), ...options };
        this.mountMiddleware = options.mountMiddleware;
        this.middlewareWildcard = options.http == 'fastify' ? '(.*)' : '*';
        return {
            module: ClsModule,
            providers: [
                {
                    provide: ClsService,
                    inject: [HttpAdapterHost],
                    useFactory: (adapterHost: HttpAdapterHost) => {
                        const adapter = adapterHost.httpAdapter;
                        console.log('adapter name ', adapter.getInstance());
                        return ClsService;
                    },
                },
            ],
            exports: [ClsService],
        };
    }
}
