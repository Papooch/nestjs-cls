import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { Test, TestingModule } from '@nestjs/testing';
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
        app.use(new ClsMiddleware().use);
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    it('works with Mercurius', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/graphql',
            payload: {
                query: `query {
                recipes {
                    id
                    title
                    description
                }
            }`,
            },
        });
        const body = JSON.parse(res.body);
        expect(body.data).toHaveProperty('recipes');
        expect(body.data.recipes[0]).toEqual({
            id: 'OK',
            title: 'OK',
            description: 'OK',
        });
    });
});
