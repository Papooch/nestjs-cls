module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    preset: 'ts-jest',
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
};
