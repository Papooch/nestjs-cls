import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsMiddleware, ClsModule } from '../../src';
import { expectIdsGql } from './expect-ids-gql';
import { ItemModule } from './item/item.module';
import { GraphQLModule } from '@nestjs/graphql';

let app: INestApplication;
describe('GQL Apollo App - Manually bound Middleware in Bootstrap', () => {
    @Module({
        imports: [
            ClsModule.register({ global: true }),
            ItemModule,
            GraphQLModule.forRoot({
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
        app.use(
            new ClsMiddleware({ useEnterWith: true, generateId: true }).use,
        );
        await app.init();
    });

    it('works with middleware', () => {
        return expectIdsGql(app);
    });

    it('does not leak context', () => {
        return Promise.all(
            Array(10)
                .fill(0)
                .map(() => expectIdsGql(app)),
        );
    });
});

describe('GQL Apollo App - Auto bound Guard', () => {
    @Module({
        imports: [
            ClsModule.register({
                global: true,
                guard: { mount: true, generateId: true },
            }),
            ItemModule,
            GraphQLModule.forRoot({
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

    it('works with guard', () => {
        return expectIdsGql(app);
    });

    it('does not leak context', () => {
        return Promise.all(
            Array(10)
                .fill(0)
                .map(() => expectIdsGql(app)),
        );
    });
});

describe('GQL Apollo App - Auto bound Interceptor', () => {
    @Module({
        imports: [
            ClsModule.register({
                global: true,
                interceptor: { mount: true, generateId: true },
            }),
            ItemModule,
            GraphQLModule.forRoot({
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

    it('works with interceptor', () => {
        return expectIdsGql(app, { skipGuard: true });
    });

    it('does not leak context', () => {
        return Promise.all(
            Array(10)
                .fill(0)
                .map(() => expectIdsGql(app, { skipGuard: true })),
        );
    });
});
