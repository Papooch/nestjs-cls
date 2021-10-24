import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const expectOkIdsGql = (
    app: INestApplication,
    options = { skipGuard: false },
) =>
    request(app.getHttpServer())
        .post('/graphql')
        .send({
            query: `query {
                items {
                    id
                    fromGuard
                    fromInterceptor
                    fromInterceptorAfter
                    fromResolver
                    fromService
                }
            }`,
        })
        .expect(200)
        .then((r) => {
            const body = r.body.data?.items[0];
            const id = body.id ?? 'no-id';
            if (!options.skipGuard) expect(body.fromGuard).toEqual(id);
            expect(body.fromInterceptor).toEqual(id);
            expect(body.fromInterceptorAfter).toEqual(id);
            expect(body.fromResolver).toEqual(id);
            expect(body.fromService).toEqual(id);
        });

export const expectErrorIdsGql = (
    app: INestApplication,
    options = { skipGuard: false },
) =>
    request(app.getHttpServer())
        .post('/graphql')
        .send({
            query: `query {
                error {
                    id
                    fromGuard
                    fromInterceptor
                    fromInterceptorAfter
                    fromResolver
                    fromService
                }
            }`,
        })
        .then((r) => {
            const body = r.body.errors?.[0].extensions.exception?.response;
            const id = body.id ?? 'no-id';
            if (!options.skipGuard) expect(body.fromGuard).toEqual(id);
            expect(body.fromInterceptor).toEqual(id);
            expect(body.fromInterceptorAfter).toEqual(id);
            expect(body.fromResolver).toEqual(id);
            expect(body.fromService).toEqual(id);
        });
