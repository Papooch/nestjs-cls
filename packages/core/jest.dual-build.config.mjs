/**
 * Verifies that the published `dist/index.js` (CJS) and `dist/index.mjs`
 * (ESM) builds are both consumable as-is (no `moduleNameMapper` redirect to
 * `src`), unlike the main `jest.config.mjs` used for the unit/e2e suites.
 * Requires `yarn build` to have run first.
 */
export default {
    rootDir: '.',
    testRegex: 'test/dual-build/.*\\.spec\\.(js|mjs)$',
    transform: {},
    testEnvironment: 'node',
    // The CJS build's compiled `require('@nestjs/common')` calls need a
    // CommonJS-compatible NestJS peer to resolve against under Jest's CJS
    // require() (mirrors a consumer on NestJS <12). The workspace's unaliased
    // `@nestjs/common` is v12, which is ESM-only, so redirect to the v10
    // `npm:` alias used elsewhere in this package for the same reason.
    moduleNameMapper: {
        '^@nestjs/common(/.*)?$': '@nestjs/common10$1',
        '^@nestjs/core(/.*)?$': '@nestjs/core10$1',
    },
};
