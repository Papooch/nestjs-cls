import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const expectOkIdsRest =
    (path = '/hello') =>
    (app: INestApplication) =>
        request(app.getHttpServer())
            .get(path)
            .expect(200)
            .then((r) => {
                const body = r.body;
                const id = body.fromGuard ?? body.fromInterceptor;
                expect(body.fromInterceptor).toEqual(id);
                expect(body.fromInterceptorAfter).toEqual(id);
                expect(body.fromController).toEqual(id);
                expect(body.fromService).toEqual(id);
            });

export const expectErrorIdsRest =
    (path = '/error') =>
    (app: INestApplication) =>
        request(app.getHttpServer())
            .get(path)
            .expect(500)
            .then((r) => {
                const body = r.body;
                const id = body.fromGuard ?? body.fromInterceptor;
                expect(body.fromInterceptor).toEqual(id);
                expect(body.fromController).toEqual(id);
                expect(body.fromService).toEqual(id);
                expect(body.fromFilter).toEqual(id);
            });
