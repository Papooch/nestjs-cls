import request from 'supertest';
import { AppModule } from './gql-mercurius.app';
import { ClsMiddleware } from '../../src';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';

describe('GQL Mercurius App', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        app = await NestFactory.create<NestFastifyApplication>(
            AppModule,
            new FastifyAdapter(),
            { logger: false },
        );
        app.use(new ClsMiddleware({ generateId: true, useEnterWith: true }).use);
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    it('works with Mercurius', async () => {
        const res = await request(app.getHttpServer())
            .post('/graphql')
            .send({
                query: `query {
                recipes {
                    id
                    title
                    description
                }
            }`,
            })
        const data = res.body.data
        expect(data).toHaveProperty('recipes');
        expect(data.recipes[0]).toEqual({
            id: 'OK',
            title: 'OK',
            description: 'OK',
        });
    });
});
