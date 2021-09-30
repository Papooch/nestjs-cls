import { NestFactory } from '@nestjs/core';
import { ClsMiddleware } from '../../src';
import { AppModule } from './gql-apollo.app';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
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
