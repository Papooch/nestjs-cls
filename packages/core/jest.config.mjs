import { createJestConfig } from '../../jest.base.config.mjs';

export default createJestConfig(import.meta.url, {
    resolver: '<rootDir>/jest.nest-v10.resolver.cjs',
});
