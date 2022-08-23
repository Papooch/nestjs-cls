import {
    Controller,
    Get,
    Global,
    INestApplication,
    Inject,
    Injectable,
    Module,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
    ClsModule,
    ClsService,
    InjectableProxy,
    InjectedProvider,
} from '../../src';

@InjectableProxy()
class RequestScopedProvider {
    id: string;

    constructor(
        private readonly cls: ClsService,
        private readonly injected: InjectedProvider,
    ) {
        console.log('in rsp constructor');
        this.id = this.cls.getId();
        console.log('injected property', this.injected.property);
    }
}

@InjectableProxy()
class RSP {
    what = 'false';
}

@Controller()
class TestRSPAppController {
    constructor(
        private readonly rsp: RequestScopedProvider,
        //private readonly rsp2: RSP,
        @Inject('WHAT') private readonly what: any,
    ) {}

    @Get('/hello')
    getHello() {
        const x = Object.assign({}, this.rsp);

        console.log('what is', { ...this.what() });
        //console.log('x is', x);
        return {
            id: this.rsp.id,
            rsp2: x,
        };
    }
}

@Global()
@Module({
    providers: [InjectedProvider],
    exports: [InjectedProvider],
})
class GlobalModule {}

@Module({
    imports: [
        GlobalModule,
        ClsModule.forRoot({
            middleware: { mount: true, generateId: true },
        }),
        ClsModule.forFeature(RSP),
        ClsModule.forFeatureAsync({
            imports: [GlobalModule],
            useClass: RequestScopedProvider,
        }),
        ClsModule.forFeatureAsync({
            provide: 'WHAT',
            imports: [GlobalModule],
            inject: ['XYZ'],
            useFactory: (m: InjectedProvider) => {
                console.log('mr is', m);
                return () => ({ factory: true });
            },
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
