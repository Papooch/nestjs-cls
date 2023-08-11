import { INestApplication } from '@nestjs/common';
import request from 'supertest';

const seenIds = new Set<string>();

export const expectOkIdsGql = (
    app: INestApplication,
    options = { skipGuard: false },
) =>
    request(app.getHttpServer())
        .post('/graphql')
        .send({
            query: `query {
                a: items {
                    id
                    fromGuard
                    fromInterceptor
                    fromInterceptorAfter
                    fromResolver
                    fromService
                    nested {
                        fromNestedResolver
                    }
                }
                b: items {
                    id
                    fromGuard
                    fromInterceptor
                    fromInterceptorAfter
                    fromResolver
                    fromService
                    nested {
                        fromNestedResolver
                    }
                }
            }`,
        })
        .expect(200)
        .then((r) => {
            const itemA = r.body.data?.a[0];
            const itemB = r.body.data?.b[0];
            const id = itemA.id ?? 'no-id';
            // expect that we have not seen that ID before,
            // which means it does not leak to concurrent requests.
            expect(seenIds.has(id)).toBe(false);
            seenIds.add(id);
            if (!options.skipGuard) expect(itemA.fromGuard).toEqual(id);
            expect(itemA.fromInterceptor).toEqual(id);
            expect(itemA.fromInterceptorAfter).toEqual(id);
            expect(itemA.fromResolver).toEqual(id);
            expect(itemA.fromService).toEqual(id);
            expect(itemA).toEqual(itemB);
        });

export const expectErrorIdsGql = (
    app: INestApplication,
    options = { skipGuard: false, skipFilter: false },
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
            if (!options.skipFilter) expect(body.fromFilter).toEqual(id);
        });
