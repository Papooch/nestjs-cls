import request from 'supertest';
import { AppModule } from './gql-mercurius.app';
import { ClsMiddleware } from '../../src';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { expectIdsGql } from './expect-ids-gql';

describe('GQL Mercurius App', () => {
    let app: NestFastifyApplication;

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

    it('works with Mercurius', async () => {
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
