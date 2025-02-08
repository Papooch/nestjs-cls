import {
    Controller,
    ExecutionContext,
    Inject,
    Module,
    Post,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
    CLS_CTX,
    CLS_REQ,
    CLS_RES,
    ClsModule,
    InjectableProxy,
} from '../../src';

import { Request, Response } from 'express';

const PROXY_RESPONSE = 'PROXY_RESPONSE';

type ProxyResponse = {
    fromReq: string;
    fromRes: string;
    fromCtx: string;
};

@InjectableProxy()
class ProxyResponseClass implements ProxyResponse {
    fromReq: string;
    fromRes: string;
    fromCtx: string;

    constructor(
        @Inject(CLS_REQ)
        request: Request,
        @Inject(CLS_RES)
        response: Response,
        @Inject(CLS_CTX)
        ctx: ExecutionContext,
    ) {
        this.fromReq = request.body.request;
        this.fromRes = response.req.body.request;
        this.fromCtx = ctx.switchToHttp().getRequest().body.request;
    }
}

@Controller()
class TestController {
    constructor(
        @Inject(PROXY_RESPONSE)
        private readonly proxyResponse: ProxyResponse,
        private readonly proxyResponseClass: ProxyResponseClass,
    ) {}

    @Post('/hello-factory')
    async helloFactory(): Promise<ProxyResponse> {
        return this.proxyResponse;
    }

    @Post('/hello-class')
    async helloClass(): Promise<ProxyResponse> {
        return this.proxyResponseClass;
    }
}

async function getTestApp(enhancer: 'interceptor' | 'guard') {
    @Module({
        imports: [
            ClsModule.forRoot({
                middleware: {
                    mount: true,
                    saveReq: true,
                    saveRes: true,
                    // defer resolving proxy providers after CTX is available (in enhancer)
                    resolveProxyProviders: false,
                },
                [enhancer]: {
                    mount: true,
                    saveCtx: true,
                    resolveProxyProviders: true,
                },
            }),
            ClsModule.forFeature(ProxyResponseClass),
            ClsModule.forFeatureAsync({
                provide: PROXY_RESPONSE,
                inject: [CLS_REQ, CLS_RES, CLS_CTX],
                useFactory: (
                    request: Request,
                    response: Response,
                    ctx: ExecutionContext,
                ): ProxyResponse => ({
                    fromReq: request.body.request,
                    fromRes: response.req.body.request,
                    fromCtx: ctx.switchToHttp().getRequest().body.request,
                }),
            }),
        ],
        controllers: [TestController],
    })
    class TestModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestModule],
    }).compile();
    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
}

describe('Using CLS_REQ, CLS_RES and CLS_CTX Proxy providers', () => {
    it.each(['interceptor', 'guard'] as const)(
        'should work with middleware and %s',
        async (enhancer) => {
            const app = await getTestApp(enhancer);

            await request(app.getHttpServer())
                .post('/hello-factory')
                .send({ request: 'value for factory' })
                .expect(201)
                .expect({
                    fromReq: 'value for factory',
                    fromRes: 'value for factory',
                    fromCtx: 'value for factory',
                });

            await request(app.getHttpServer())
                .post('/hello-class')
                .send({ request: 'value for class' })
                .expect(201)
                .expect({
                    fromReq: 'value for class',
                    fromRes: 'value for class',
                    fromCtx: 'value for class',
                });

            await app.close();
        },
    );
});
