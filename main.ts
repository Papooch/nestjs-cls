import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ClsMiddleware } from './src/cls.middleware';
import { ClsModule } from './src/cls.module';
import { TestHttpController, TestHttpService } from './test/http/http.app';

@Module({
    imports: [ClsModule.register({ http: 'fastify' })],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
class AppModule {}

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    );
    app.listen(8000);
}
bootstrap();
