import { AsyncLocalStorage } from 'async_hooks';
import { ClsService } from './cls.service.js';

/**
 * The AsyncLocalStorage instance is stored on `globalThis` under a registry
 * symbol, so that it is shared between all copies of this package loaded in
 * the same process. That happens when the package is loaded both via `import`
 * (the ESM build) and `require` (the CJS build) - without sharing, each copy
 * would only see its own context.
 */
const ALS_KEY: unique symbol = Symbol.for('nestjs-cls:AsyncLocalStorage');

function getOrCreateSharedAls(): AsyncLocalStorage<any> {
    const globalObject = globalThis as {
        [ALS_KEY]?: AsyncLocalStorage<any>;
    };
    if (!globalObject[ALS_KEY]) {
        const als = new AsyncLocalStorage();
        // Establish a root ALS context so that subsequent enterWith() calls in guards
        // scope to the current request's async context rather than the global root.
        // This mitigates the enterWith() context-leak bug on Node.js < 24
        // (fixed upstream in https://github.com/nodejs/node/pull/58029).
        als.enterWith(undefined);
        globalObject[ALS_KEY] = als;
    }
    return globalObject[ALS_KEY];
}

export const globalClsService = new ClsService(getOrCreateSharedAls());
