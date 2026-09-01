module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.m?tsx?$': ['ts-jest', {
            useESM: true,
            tsconfig: {
                module: 'ESNext',
                moduleResolution: 'bundler',
                rootDir: '../../..',
            },
        }],
    },
    moduleNameMapper: {
        '^nestjs-cls$': '<rootDir>/../../core/src/index.ts',
        '^nestjs-cls/(.*)$': '<rootDir>/../../core/src/$1',
        '^@nestjs-cls/transactional$': '<rootDir>/../../transactional/src/index.ts',
        '^@nestjs-cls/transactional/(.*)$': '<rootDir>/../../transactional/src/$1',
    },
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
};
