module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['src/**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            isolatedModules: true,
            maxWorkers: 1,
        },
    },
};
