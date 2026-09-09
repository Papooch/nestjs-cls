// Plain CommonJS test file (no ts-jest/ESM transform): simulates a consumer
// whose Jest setup runs in the default CJS mode and `require()`s the package.
const {
    ClsModule,
    ClsService,
    InjectableProxy,
} = require('../../dist/index.js');

describe('nestjs-cls CJS build', () => {
    it('is requireable and exposes the public API', () => {
        expect(typeof ClsModule).toBe('function');
        expect(typeof ClsService).toBe('function');
        expect(typeof InjectableProxy).toBe('function');
    });

    it('constructs a working ClsService bound to a fresh store', () => {
        const { ClsServiceManager } = require('../../dist/index.js');
        const cls = ClsServiceManager.getClsService();
        expect(
            cls.run(() => {
                cls.set('key', 'value');
                return cls.get('key');
            }),
        ).toBe('value');
    });
});
