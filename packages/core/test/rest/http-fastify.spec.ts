import { Module } from '@nestjs/common';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from '../../src';
import { expectOkIdsRest } from './expect-ids-rest';
import { TestHttpController, TestHttpService } from './http.app';

@Module({
    imports: [
        ClsModule.forRoot({
            middleware: { mount: true },
        }),
    ],
    providers: [TestHttpService],
    controllers: [TestHttpController],
})
export class TestHttpApp {}

describe('Http Fastify App', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestHttpApp],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    it('works with Fastify', async () => {
        return expectOkIdsRest(app);
    });
});
