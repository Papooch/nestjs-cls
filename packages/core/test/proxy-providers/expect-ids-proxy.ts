import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface ProxyResult {
    rscId: string;
    rsfId: string;
    controlValue: string;
}

export interface ProxyResults {
    beforeWait: ProxyResult;
    afterWait: ProxyResult;
}

export const expectOkIdsProxy = (app: INestApplication) =>
    request(app.getHttpServer())
        .get('/hello')
        .expect(200)
        .then((r) => {
            const body: ProxyResults = r.body;
            expect(body.beforeWait.rscId).toEqual(expect.any(String));
            expect(body.beforeWait.rscId).toEqual(body.beforeWait.rsfId);
            expect(body.afterWait).toEqual(body.beforeWait);
        });
