import {
    Controller,
    Get,
    INestApplication,
    Inject,
    Module,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule, ClsService } from '../../src';
import request from 'supertest';

class RequestScopedProvider {
    id: string;

    constructor(private readonly cls: ClsService) {
        console.log('in rsp constructor');
        this.id = this.cls.getId();
    }
}

class RSP {
    what = 'false';
}

@Controller()
class TestRSPAppController {
    constructor(
        private readonly rsp: RequestScopedProvider,
        private readonly rsp2: RSP,
    ) {}

    @Get('/hello')
    getHello() {
        const x = Object.assign({}, this.rsp2);

        console.log('x is', x);
        return {
            id: this.rsp.id,
            rsp2: x,
        };
    }
}

@Module({
    imports: [
        ClsModule.register({
            middleware: { mount: true, generateId: true },
            proxyProviders: [RequestScopedProvider, RSP],
        }),
    ],
    controllers: [TestRSPAppController],
})
export class TestRSPAppModule {}

describe('RSP', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestRSPAppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('bootstraps', () => {
        return request(app.getHttpServer()).get('/hello').expect('wtf');
    });
});
