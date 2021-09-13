import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ClsModule } from '../../src';
import { TestHttpController, TestHttpService } from './http.app';

@Module({
    imports: [ClsModule.register()],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestHttpApp {}

describe('Cls Module over HTTP', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestHttpApp],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('works with Express', () => {
        return request(app.getHttpServer())
            .get('/hello')
            .expect(200)
            .expect('Hello world');
    });
});
