import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './gql-apollo.app';
import { ClsMiddleware } from '../../src';

describe('GQL Apollo App', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.use(new ClsMiddleware().use);
        await app.init();
    });

    it('works wit Apollo', () => {
        return request(app.getHttpServer())
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
            .then((r) => {
                expect(r.body.data).toHaveProperty('recipes');
                expect(r.body.data.recipes[0]).toEqual({
                    id: 'OK',
                    title: 'OK',
                    description: 'OK',
                });
            });
    });
});
