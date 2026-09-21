import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const coreSrc = resolve(repoRoot, 'packages/core/src');
const transactionalSrc = resolve(repoRoot, 'packages/transactional/src');

/**
 * Shared Jest configuration for the nestjs-cls monorepo.
 *
 * NestJS 12 is published as ESM only, so the suites have to run through Jest's
 * ESM runtime (each package's `test` script passes `--experimental-vm-modules`).
 * A consequence is that workspace peers cannot be loaded from their CommonJS
 * `dist` output anymore — inside Jest's runtime a CJS module cannot `require()`
 * an ESM one — so `moduleNameMapper` redirects them to their TypeScript sources,
 * which ts-jest compiles as ESM. The paths are absolute so they work from any
 * nesting depth.
 *
 * Suites that need a database declare the services they use. They are shared
 * across the whole monorepo — one Postgres and one Mongo container defined in
 * `test/docker-compose.yml` — and brought up on demand by the global setup.
 * Each spec file that talks to Postgres gets its own database, since Jest runs
 * the spec files of a package in parallel workers.
 *
 * @param {string} packageUrl the calling config's `import.meta.url`
 * @param {import('jest').Config & {
 *     services?: ('postgres' | 'mongo')[],
 *     postgresDatabases?: string[],
 * }} [overrides]
 * @returns {import('jest').Config}
 */
export function createJestConfig(packageUrl, overrides = {}) {
    const packageDir = dirname(fileURLToPath(packageUrl));
    const { services = [], postgresDatabases = [], ...rest } = overrides;
    return {
        moduleFileExtensions: ['js', 'json', 'ts'],
        rootDir: '.',
        testRegex: '.*\\.spec\\.ts$',
        extensionsToTreatAsEsm: ['.ts'],
        transform: {
            '^.+\\.m?tsx?$': [
                'ts-jest',
                {
                    useESM: true,
                    tsconfig: resolve(packageDir, 'tsconfig.json'),
                },
            ],
        },
        moduleNameMapper: {
            '^nestjs-cls$': `${coreSrc}/index.ts`,
            '^nestjs-cls/(.*)$': `${coreSrc}/$1`,
            '^@nestjs-cls/transactional$': `${transactionalSrc}/index.ts`,
            '^@nestjs-cls/transactional/(.*)$': `${transactionalSrc}/$1`,
            // The source now imports its own relative modules with an
            // explicit `.js` extension (the TypeScript "nodenext" convention
            // required for the dual ESM/CJS build to resolve correctly at
            // runtime). Jest/ts-jest compiles straight from `.ts` sources, so
            // that extension is stripped back off before resolution.
            '^(\\.{1,2}/.*)\\.js$': '$1',
        },
        collectCoverageFrom: ['src/**/*.ts'],
        coverageDirectory: '../coverage',
        testEnvironment: 'node',
        ...(services.length
            ? {
                  globalSetup: resolve(repoRoot, 'test/global-setup.mjs'),
                  globalTeardown: resolve(repoRoot, 'test/global-teardown.mjs'),
                  globals: {
                      testDbServices: services,
                      testPostgresDatabases: postgresDatabases,
                  },
              }
            : {}),
        ...rest,
    };
}
