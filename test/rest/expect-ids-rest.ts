import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const expectIdsRest = (app: INestApplication) =>
    request(app.getHttpServer())
        .get('/hello')
        .expect(200)
        .then((r) => {
            const body = r.body;
            const id = body.fromGuard ?? body.fromInterceptor;
            expect(body.fromInterceptor).toEqual(id);
            expect(body.fromInterceptorAfter).toEqual(id);
            expect(body.fromController).toEqual(id);
            expect(body.fromService).toEqual(id);
        });
