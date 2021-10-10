import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ClsModule } from '../../src';
import { TestHttpController, TestHttpService } from './http.app';

@Module({
    imports: [
        ClsModule.register({
            middleware: { mount: true, generateId: true, useEnterWith: true },
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
