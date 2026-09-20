// Verifies that when both builds are loaded in the same process (`import` and
// `require` of the same package), the two copies share the CLS context.
// Run with plain Node (not Jest), since the CJS build needs Node's native
// `require(esm)` to load NestJS 12.
import 'reflect-metadata';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import * as esm from 'nestjs-cls';

const cjs = createRequire(import.meta.url)('nestjs-cls');
assert.notStrictEqual(esm.ClsService, cjs.ClsService, 'expected two copies');
assert.strictEqual(esm.CLS_ID, cjs.CLS_ID);

const esmCls = esm.ClsServiceManager.getClsService();
const cjsCls = cjs.ClsServiceManager.getClsService();
esmCls.run(() => {
    esmCls.set('key', 'value');
    esmCls.set(esm.CLS_ID, 'id');
    assert.strictEqual(cjsCls.isActive(), true);
    assert.strictEqual(cjsCls.get('key'), 'value');
    assert.strictEqual(cjsCls.getId(), 'id');
});
console.log('Shared context OK');
