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
 * @param {string} packageUrl the calling config's `import.meta.url`
 * @param {import('jest').Config} [overrides]
 * @returns {import('jest').Config}
 */
export function createJestConfig(packageUrl, overrides = {}) {
    const packageDir = dirname(fileURLToPath(packageUrl));
    return {
        moduleFileExtensions: ['js', 'json', 'ts'],
        rootDir: '.',
        testRegex: '.*\\.spec\\.ts$',
        extensionsToTreatAsEsm: ['.ts'],
        transform: {
            '^.+\\.m?tsx?$': [
                'ts-jest',
                { useESM: true, tsconfig: resolve(packageDir, 'tsconfig.json') },
            ],
        },
        moduleNameMapper: {
            '^nestjs-cls$': `${coreSrc}/index.ts`,
            '^nestjs-cls/(.*)$': `${coreSrc}/$1`,
            '^@nestjs-cls/transactional$': `${transactionalSrc}/index.ts`,
            '^@nestjs-cls/transactional/(.*)$': `${transactionalSrc}/$1`,
        },
        collectCoverageFrom: ['src/**/*.ts'],
        coverageDirectory: '../coverage',
        testEnvironment: 'node',
        ...overrides,
    };
}
