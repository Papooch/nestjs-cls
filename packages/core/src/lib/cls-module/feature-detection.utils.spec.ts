import {
    detectHttpAdapterTypeAndVersion,
    ExpressVersion,
    FastifyVersion,
    HttpAdapterType,
} from './feature-detection.utils';

// Helper to build a minimal mock HttpServer compatible with detectHttpAdapterTypeAndVersion.
// `adapterName` controls whether it looks like Express or Fastify.
// `instance` is the raw platform instance returned by getInstance().
function makeAdapter(adapterName: string, instance: object) {
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    const Cls = { [adapterName]: class {} }[adapterName]!;
    const adapter = new Cls() as any;
    adapter.getInstance = () => instance;
    return adapter;
}

describe('FeatureDetectionUtils', () => {
    describe('When using Express adapter', () => {
        it('should detect Express version 4 (has app.del)', () => {
            // Express 4.x has the deprecated `del` method
            const expressV4Instance = { del: () => {} };
            const adapter = makeAdapter('ExpressAdapter', expressV4Instance);
            expect(detectHttpAdapterTypeAndVersion(adapter)).toEqual({
                adapterType: HttpAdapterType.EXPRESS,
                version: ExpressVersion.V4,
            });
        });

        it('should detect Express version 5 (no app.del)', () => {
            // Express 5.x removes `del`
            const expressV5Instance = {};
            const adapter = makeAdapter('ExpressAdapter', expressV5Instance);
            expect(detectHttpAdapterTypeAndVersion(adapter)).toEqual({
                adapterType: HttpAdapterType.EXPRESS,
                version: ExpressVersion.V5,
            });
        });
    });

    describe('When using Fastify adapter', () => {
        it('should detect Fastify version 4 (has getDefaultRoute/setDefaultRoute)', () => {
            // Fastify 4.x has getDefaultRoute and setDefaultRoute
            const fastifyV4Instance = {
                getDefaultRoute: () => {},
                setDefaultRoute: () => {},
            };
            const adapter = makeAdapter('FastifyAdapter', fastifyV4Instance);
            expect(detectHttpAdapterTypeAndVersion(adapter)).toEqual({
                adapterType: HttpAdapterType.FASTIFY,
                version: FastifyVersion.V4,
            });
        });

        it('should detect Fastify version 5 (no getDefaultRoute/setDefaultRoute)', () => {
            // Fastify 5.x removes those methods
            const fastifyV5Instance = {};
            const adapter = makeAdapter('FastifyAdapter', fastifyV5Instance);
            expect(detectHttpAdapterTypeAndVersion(adapter)).toEqual({
                adapterType: HttpAdapterType.FASTIFY,
                version: FastifyVersion.V5,
            });
        });
    });
});
