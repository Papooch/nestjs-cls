import {
    INestApplication,
    Module,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import { WebSocketGateway } from '@nestjs/websockets';
import { ClsGuard, ClsInterceptor, ClsModule } from '../../src';
import { expectErrorIdsWs, expectOkIdsWs } from './expect-ids-websockets';
import { TestWebsocketGateway, TestWebsocketService } from './websockets.app';

describe('Websockets - WS', () => {
    let app: INestApplication;

    @WebSocketGateway({ path: 'interceptor' })
    @UseInterceptors(ClsInterceptor)
    class WebsocketGatewayWithClsInterceptor extends TestWebsocketGateway {}

    @WebSocketGateway({ path: 'guard' })
    @UseGuards(ClsGuard)
    class WebsocketGatewayWithClsGuard extends TestWebsocketGateway {}

    @Module({
        imports: [
            ClsModule.forRoot({
                interceptor: { mount: false, generateId: true },
                guard: { mount: false, generateId: true },
            }),
        ],
        providers: [
            TestWebsocketService,
            WebsocketGatewayWithClsInterceptor,
            WebsocketGatewayWithClsGuard,
        ],
    })
    class TestWebsocketModule {}

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [TestWebsocketModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useWebSocketAdapter(new WsAdapter(app));
        await app.listen(3125);
    });

    afterAll(async () => {
        await app?.close();
    });

    describe.each(['guard', 'interceptor'])(
        'when using an %s to initialize the context',
        (name) => {
            const path = '/' + name;

            it.each([
                ['ok', 'object', expectOkIdsWs(path, 'hello', { value: 12 })],
                ['ok', 'primitive', expectOkIdsWs(path, 'hello', 'primitive')],
                [
                    'error',
                    'object',
                    expectErrorIdsWs(path, 'error', { value: 12 }),
                ],
                [
                    'error',
                    'primitive',
                    expectErrorIdsWs(path, 'error', 'primitive'),
                ],
            ])('works with %s response and %s payload', async (_, __, func) => {
                await func(app);
            });
        },
    );
});
