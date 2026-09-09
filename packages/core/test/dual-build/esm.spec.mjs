// Native ESM test file (`.mjs`, run without a transform): simulates a
// consumer whose Jest setup runs in ESM mode (e.g. NestJS 12) and `import`s
// the package directly.
import {
    ClsModule,
    ClsService,
    ClsServiceManager,
    InjectableProxy,
} from '../../dist/esm/index.js';

describe('nestjs-cls ESM build', () => {
    it('is importable and exposes the public API', () => {
        expect(typeof ClsModule).toBe('function');
        expect(typeof ClsService).toBe('function');
        expect(typeof InjectableProxy).toBe('function');
    });

    it('constructs a working ClsService bound to a fresh store', () => {
        const cls = ClsServiceManager.getClsService();
        expect(
            cls.run(() => {
                cls.set('key', 'value');
                return cls.get('key');
            }),
        ).toBe('value');
    });
});
