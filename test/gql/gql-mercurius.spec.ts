import { ClsMiddleware, ClsModule } from '../../src';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { expectIdsGql } from './expect-ids-gql';
import { Module } from '@nestjs/common';
import { ItemModule } from './item/item.module';
import { MercuriusModule } from 'nestjs-mercurius';

let app: NestFastifyApplication;
describe('GQL Mercurius App - Manually bound Middleware in Bootstrap', () => {
    @Module({
        imports: [
            ClsModule.register({ global: true }),
            ItemModule,
            MercuriusModule.forRoot({
                autoSchemaFile: __dirname + 'schema.gql',
            }),
        ],
    })
    class AppModule {}

    beforeAll(async () => {
        app = await NestFactory.create<NestFastifyApplication>(
            AppModule,
            new FastifyAdapter(),
            { logger: false },
        );
        app.use(
            new ClsMiddleware({ generateId: true, useEnterWith: true }).use,
        );
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    it('works with middleware', async () => {
        return expectIdsGql(app);
    });

    it('does not leak context', () => {
        return Promise.all([
            expectIdsGql(app),
            expectIdsGql(app),
            expectIdsGql(app),
            expectIdsGql(app),
            expectIdsGql(app),
        ]);
    });
});
