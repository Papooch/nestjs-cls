import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ClsModule } from '../../src';
import { TestHttpController, TestHttpService } from './http.app';

@Module({
    imports: [
        ClsModule.register({
            interceptor: { mount: true, generateId: true },
        }),
    ],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestHttpApp {}

async function bootstrap() {
    const app = await NestFactory.create(TestHttpApp);
    await app.listen(3000);
}
bootstrap();
