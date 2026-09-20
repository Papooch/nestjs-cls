// Verifies that the published ESM build can be `import`ed by its package name
// (through the `exports` map) in Jest's ESM runtime and used in a Nest 12
// application. Jest does not support `require(esm)`, so loading the CJS build
// here fails (https://github.com/Papooch/nestjs-cls/issues/631).
import 'reflect-metadata';
import { createRequire } from 'node:module';
import * as common from '@nestjs/common';
import * as core from '@nestjs/core';
import * as cls from 'nestjs-cls';

const runApp = createRequire(import.meta.url)('./run-app.cjs');

describe('ESM build', () => {
    it('works in a Nest application', async () => {
        await expect(runApp({ common, core, cls })).resolves.toBe('value');
    });
});
