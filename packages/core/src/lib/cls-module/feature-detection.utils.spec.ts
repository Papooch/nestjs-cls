import { HttpServer } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import {
    detectHttpAdapterTypeAndVersion,
    ExpressVersion,
    FastifyVersion,
    HttpAdapterType,
} from './feature-detection.utils';

// The CJS v10 platform adapters internally require('@nestjs/common'), which
// is ESM in NestJS 12.  Jest's experimental VM module runtime cannot bridge
// CJS→ESM require, so loading @nestjs/platform-express10 in this test suite
// is not possible.  Instead every case uses the real v12 adapter (and thus
// a real express / fastify instance under the hood); the v4 detection path
// is exercised by injecting the v4-specific API surface that was removed in
// v5 — the same property the detection function actually checks.
describe('FeatureDetectionUtils', () => {
    describe('When using Express adapter', () => {
        it('should detect Express version 4 (app.del present)', () => {
            const adapter = new ExpressAdapter();
            // Simulate express 4: the `del` method was removed in express 5
            (adapter.getInstance() as Record<string, unknown>).del = () => {};
            expect(
                detectHttpAdapterTypeAndVersion(adapter as unknown as HttpServer),
            ).toEqual({
                adapterType: HttpAdapterType.EXPRESS,
                version: ExpressVersion.V4,
            });
        });

        it('should detect Express version 5 (app.del absent — real express 5 instance)', () => {
            const adapter = new ExpressAdapter();
            expect(
                detectHttpAdapterTypeAndVersion(adapter as unknown as HttpServer),
            ).toEqual({
                adapterType: HttpAdapterType.EXPRESS,
                version: ExpressVersion.V5,
            });
        });
    });

    describe('When using Fastify adapter', () => {
        it('should detect Fastify version 4 (getDefaultRoute/setDefaultRoute present)', () => {
            const adapter = new FastifyAdapter();
            // Simulate fastify 4: those methods were removed in fastify 5
            const inst = adapter.getInstance() as Record<string, unknown>;
            inst.getDefaultRoute = () => {};
            inst.setDefaultRoute = () => {};
            expect(
                detectHttpAdapterTypeAndVersion(adapter as unknown as HttpServer),
            ).toEqual({
                adapterType: HttpAdapterType.FASTIFY,
                version: FastifyVersion.V4,
            });
        });

        it('should detect Fastify version 5 (getDefaultRoute/setDefaultRoute absent — real fastify 5 instance)', () => {
            const adapter = new FastifyAdapter();
            expect(
                detectHttpAdapterTypeAndVersion(adapter as unknown as HttpServer),
            ).toEqual({
                adapterType: HttpAdapterType.FASTIFY,
                version: FastifyVersion.V5,
            });
        });
    });
});
