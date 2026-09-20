// Verifies that the published CommonJS build can be `require`d by its package
// name (through the `exports` map) and used in a Nest application. Run with
// plain Node (not Jest), since NestJS 12 is ESM only and only Node's native
// `require(esm)` can load it from CommonJS.
require('reflect-metadata');
const assert = require('node:assert');
const runApp = require('./run-app.cjs');

runApp({
    common: require('@nestjs/common'),
    core: require('@nestjs/core'),
    cls: require('nestjs-cls'),
}).then((value) => {
    assert.strictEqual(value, 'value');
    console.log('CJS build OK');
});
