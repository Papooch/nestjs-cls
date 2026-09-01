'use strict';

const path = require('path');

/**
 * Shared Jest configuration for the nestjs-cls monorepo.
 *
 * Each package's jest.config.js spreads `base` and calls `esmTransform(rootDir)`
 * with its package-specific TypeScript rootDir override. The `moduleNameMapper`
 * uses absolute paths (resolved from the monorepo root) so it works for every
 * package regardless of nesting depth, redirecting workspace peer imports to
 * their TypeScript source so ts-jest compiles them as ESM instead of loading
 * the pre-built CJS dist.
 */

/**
 * Builds the ts-jest ESM transform entry.
 * @param {string} [rootDir] tsconfig rootDir override — required when
 *   moduleNameMapper redirects imports to source files outside the package.
 */
function esmTransform(rootDir) {
    const tsconfig = { module: 'ESNext', moduleResolution: 'bundler' };
    if (rootDir) tsconfig.rootDir = rootDir;
    return { '^.+\\.m?tsx?$': ['ts-jest', { useESM: true, tsconfig }] };
}

const coreSrc = path.resolve(__dirname, 'packages/core/src');
const transactionalSrc = path.resolve(__dirname, 'packages/transactional/src');

module.exports = {
    base: {
        moduleFileExtensions: ['js', 'json', 'ts'],
        rootDir: '.',
        testRegex: '.*\\.spec\\.ts$',
        extensionsToTreatAsEsm: ['.ts'],
        moduleNameMapper: {
            '^nestjs-cls$': `${coreSrc}/index.ts`,
            '^nestjs-cls/(.*)$': `${coreSrc}/$1`,
            '^@nestjs-cls/transactional$': `${transactionalSrc}/index.ts`,
            '^@nestjs-cls/transactional/(.*)$': `${transactionalSrc}/$1`,
        },
        collectCoverageFrom: ['src/**/*.ts'],
        coverageDirectory: '../coverage',
        testEnvironment: 'node',
    },
    esmTransform,
};
