import {
    DynamicModule,
    MiddlewareConsumer,
    Module,
    NestModule,
} from '@nestjs/common';
import { ClsMiddleware } from './cls.middleware';
import { ClsService } from './cls.service';

class ClsModuleOptions {
    http: 'express' | 'fastify' = 'express';
}

@Module({})
export class ClsModule implements NestModule {
    private static middlewareWildcard = '*';

    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ClsMiddleware).forRoutes(ClsModule.middlewareWildcard);
    }

    static register(options: ClsModuleOptions): DynamicModule {
        options = { ...new ClsModuleOptions(), ...options };
        this.middlewareWildcard = options.http == 'fastify' ? '.*' : '*';
        return {
            module: ClsModule,
            providers: [ClsService],
            exports: [ClsService],
        };
    }
}
