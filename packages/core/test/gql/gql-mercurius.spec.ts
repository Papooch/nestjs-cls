import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver } from '@nestjs/mercurius/dist/drivers/mercurius.driver';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ClsModule } from '../../src';
import { expectErrorIdsGql, expectOkIdsGql } from './expect-ids-gql';
import { ItemModule } from './item/item.module';

let app: NestFastifyApplication;
describe('GQL Mercurius App - Auto bound Middleware', () => {
    @Module({
        imports: [
            ClsModule.forRoot({
                global: true,
                middleware: { mount: true, generateId: true },
            }),
            ItemModule,
            GraphQLModule.forRoot({
                driver: MercuriusDriver,
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
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    it.each([
        ['OK', expectOkIdsGql],
        ['ERROR', expectErrorIdsGql],
    ])('works with %s response', (_, func: any) => {
        return func(app);
    });
    it.each([
        ['OK', expectOkIdsGql],
        ['ERROR', expectErrorIdsGql],
    ])('does not leak context with %s response', (_, func: any) => {
        return Promise.all(Array(10).fill(app).map(func));
    });
});

describe('GQL Mercurius App - Auto bound Guard', () => {
    @Module({
        imports: [
            ClsModule.forRoot({
                global: true,
                guard: { mount: true, generateId: true },
            }),
            ItemModule,
            GraphQLModule.forRoot({
                driver: MercuriusDriver,
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
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    it.each([
        ['OK', expectOkIdsGql],
        ['ERROR', expectErrorIdsGql],
    ])('works with %s response', (_, func: any) => {
        return func(app);
    });

    it.each([
        ['OK', expectOkIdsGql],
        ['ERROR', expectErrorIdsGql],
    ])('does not leak context with %s response', (_, func: any) => {
        return Promise.all(Array(10).fill(app).map(func));
    });
});

describe('GQL Mercurius App - Auto bound Interceptor', () => {
    @Module({
        imports: [
            ClsModule.forRoot({
                global: true,
                interceptor: { mount: true, generateId: true },
            }),
            ItemModule,
            GraphQLModule.forRoot({
                driver: MercuriusDriver,
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
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    it.each([
        ['OK', expectOkIdsGql],
        ['ERROR', expectErrorIdsGql],
    ])('works with %s response', (_, func: any) => {
        return func(app, { skipGuard: true, skipFilter: true });
    });

    it.each([
        ['OK', expectOkIdsGql],
        ['ERROR', expectErrorIdsGql],
    ])('does not leak context with % response', (_, func: any) => {
        return Promise.all(
            Array(10)
                .fill(0)
                .map(() => func(app, { skipGuard: true, skipFilter: true })),
        );
    });
});
