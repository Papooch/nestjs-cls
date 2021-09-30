import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ClsMiddleware } from '../../src';
import { AppModule } from './gql-mercurius.app';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    );
    app.use(
        new ClsMiddleware({
            generateId: true,
            idGenerator: () => {
                return Math.random().toString(36).slice(-10);
            },
        }).use,
    );
    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
