import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './gql-apollo.app';
import { ClsMiddleware } from '../../src';
import { expectIdsGql } from './expect-ids-gql';

describe('GQL Apollo App', () => {
    let app: INestApplication;

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

    it('works wit Apollo', () => {
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
