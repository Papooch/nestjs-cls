module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                isolatedModules: true,
                maxWorkers: 1,
            },
        ],
    },
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
};
