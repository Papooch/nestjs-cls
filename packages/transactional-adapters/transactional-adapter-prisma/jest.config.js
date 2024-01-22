module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            isolatedModules: true,
            maxWorkers: 1,
        },
    },
};
