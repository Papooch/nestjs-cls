import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TestHttpApp } from './http.app';

describe('Cls Module over HTTP', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestHttpApp],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('works', () => {
        return request(app.getHttpServer())
            .get('/')
            .expect(200)
            .expect('Hello world');
    });
});
