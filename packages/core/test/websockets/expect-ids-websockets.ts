import { INestApplication } from '@nestjs/common';
import request from 'superwstest';

export const expectOkIdsWs =
    (path = '', event = 'hello', data = {}) =>
    async (app: INestApplication) =>
        request(await app.getUrl())
            .ws(path)
            .sendJson({
                event,
                data,
            })
            .expectJson((body) => {
                const id = body.fromGuard ?? body.fromInterceptor;
                expect(body.fromInterceptor).toEqual(id);
                expect(body.fromInterceptorAfter).toEqual(id);
                expect(body.fromGateway).toEqual(id);
                expect(body.fromService).toEqual(id);
                expect(body.data).toEqual(data);
            })
            .close();

export const expectErrorIdsWs =
    (path = '', event = 'error', data = {}) =>
    (app: INestApplication) =>
        request(app.getHttpServer())
            .ws(path)
            .sendJson({
                event,
                data,
            })
            .expectJson((body) => {
                const id = body.fromGuard ?? body.fromInterceptor;
                expect(body.fromInterceptor).toEqual(id);
                expect(body.fromGateway).toEqual(id);
                expect(body.fromService).toEqual(id);
                expect(body.fromFilter).toEqual(id);
            })
            .close();
