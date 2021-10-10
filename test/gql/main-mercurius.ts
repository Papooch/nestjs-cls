import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { MercuriusModule } from 'nestjs-mercurius';
import { ClsMiddleware, ClsModule } from '../../src';
import { ItemModule } from './item/item.module';

@Module({
    imports: [
        ClsModule.register({ global: true }),
        ItemModule,
        MercuriusModule.forRoot({
            autoSchemaFile: __dirname + 'schema.gql',
        }),
    ],
})
export class AppModule {}

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    );
    app.use(
        new ClsMiddleware({
            useEnterWith: true,
            generateId: true,
            idGenerator: () => {
                return Math.random().toString(36).slice(-8);
            },
        }).use,
    );
    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
