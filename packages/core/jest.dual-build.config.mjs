/**
 * Runs the tests in `test/dual-build` against the built `dist` output
 * (`yarn build:release` has to run first), resolved through the package's `exports`
 * map, instead of redirecting to the sources like `jest.config.mjs` does.
 */
export default {
    rootDir: '.',
    testRegex: 'test/dual-build/.*\\.spec\\.mjs$',
    transform: {},
    testEnvironment: 'node',
};
