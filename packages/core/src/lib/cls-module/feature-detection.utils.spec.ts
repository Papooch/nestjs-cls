import {
    detectHttpAdapterTypeAndVersion,
    ExpressVersion,
    FastifyVersion,
    HttpAdapterType,
} from './feature-detection.utils';

/**
 * The `*10` imports are `npm:` aliases of the NestJS 10 packages (see this
 * package's devDependencies), so every case boots a real Nest app on the Nest
 * version it claims to test — NestJS 10 pulls in express 4 / fastify 4, the
 * current (11+) one express 5 / fastify 5.
 *
 * Loading the v10 packages under Jest's ESM runtime needs
 * `jest.nest-v10.resolver.cjs`, which keeps their internal `@nestjs/*`
 * requires pointed at the v10 aliases instead of the ESM-only current ones.
 */
async function getNest10Deps() {
    const common = await import('@nestjs/common10');
    const testing = await import('@nestjs/testing10');
    const platformFastify = await import('@nestjs/platform-fastify10');
    return { common, testing, platformFastify };
}

async function getNestDeps() {
    const common = await import('@nestjs/common');
    const testing = await import('@nestjs/testing');
    const platformFastify = await import('@nestjs/platform-fastify');
    return { common, testing, platformFastify };
}

describe('FeatureDetectionUtils', () => {
    describe('When using Express adapter', () => {
        async function getExpressApp(
            deps: Awaited<
                ReturnType<typeof getNestDeps | typeof getNest10Deps>
            >,
        ) {
            const { Module } = deps.common;
            const { Test } = deps.testing;

            @Module({})
            class TestModule {}

            const module = await Test.createTestingModule({
                imports: [TestModule],
            }).compile();
            return module.createNestApplication();
        }
        it('should detect Express version 4 on Nest 10', async () => {
            const app = await getExpressApp(await getNest10Deps());

            const features = detectHttpAdapterTypeAndVersion(
                app.getHttpAdapter(),
            );

            expect(features).toEqual({
                adapterType: HttpAdapterType.EXPRESS,
                version: ExpressVersion.V4,
            });
        });

        it('should detect Express version 5 on the current Nest', async () => {
            const app = await getExpressApp(await getNestDeps());

            const features = detectHttpAdapterTypeAndVersion(
                app.getHttpAdapter(),
            );

            expect(features).toEqual({
                adapterType: HttpAdapterType.EXPRESS,
                version: ExpressVersion.V5,
            });
        });
    });

    describe('When using Fastify adapter', () => {
        async function getFastifyApp(
            deps: Awaited<
                ReturnType<typeof getNestDeps | typeof getNest10Deps>
            >,
        ) {
            const { Module } = deps.common;
            const { Test } = deps.testing;
            const { FastifyAdapter } = deps.platformFastify;

            @Module({})
            class TestModule {}

            const module = await Test.createTestingModule({
                imports: [TestModule],
            }).compile();
            return module.createNestApplication(new (FastifyAdapter as any)());
        }

        it('should detect Fastify version 4 on Nest 10', async () => {
            const app = await getFastifyApp(await getNest10Deps());
            const features = detectHttpAdapterTypeAndVersion(
                app.getHttpAdapter(),
            );

            expect(features).toEqual({
                adapterType: HttpAdapterType.FASTIFY,
                version: FastifyVersion.V4,
            });
        });

        it('should detect Fastify version 5 on the current Nest', async () => {
            const app = await getFastifyApp(await getNestDeps());

            const features = detectHttpAdapterTypeAndVersion(
                app.getHttpAdapter(),
            );

            expect(features).toEqual({
                adapterType: HttpAdapterType.FASTIFY,
                version: FastifyVersion.V5,
            });
        });
    });
});
