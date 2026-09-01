module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.m?tsx?$': ['ts-jest', {
            useESM: true,
            tsconfig: { module: 'ESNext', moduleResolution: 'bundler' },
        }],
    },
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
};
