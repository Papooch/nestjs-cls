import { ApolloDriver } from '@nestjs/apollo';
import { INestApplication, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from '../../src';
import { expectErrorIdsGql, expectOkIdsGql } from './expect-ids-gql';
import { ItemModule } from './item/item.module';

let app: INestApplication;
describe('GQL Apollo App - Auto bound Middleware', () => {
    @Module({
        imports: [
            ClsModule.forRoot({
                global: true,
                middleware: { mount: true, generateId: true },
            }),
            ItemModule,
            GraphQLModule.forRoot({
                driver: ApolloDriver,
                autoSchemaFile: __dirname + 'schema.gql',
            }),
        ],
    })
    class AppModule {}

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
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

describe('GQL Apollo App - Auto bound Guard', () => {
    @Module({
        imports: [
            ClsModule.forRoot({
                global: true,
                guard: { mount: true, generateId: true },
            }),
            ItemModule,
            GraphQLModule.forRoot({
                driver: ApolloDriver,
                autoSchemaFile: __dirname + 'schema.gql',
            }),
        ],
    })
    class AppModule {}

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
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

describe('GQL Apollo App - Auto bound Interceptor', () => {
    @Module({
        imports: [
            ClsModule.forRoot({
                global: true,
                interceptor: { mount: true, generateId: true },
            }),
            ItemModule,
            GraphQLModule.forRoot({
                driver: ApolloDriver,
                autoSchemaFile: __dirname + 'schema.gql',
            }),
        ],
    })
    class AppModule {}

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
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
