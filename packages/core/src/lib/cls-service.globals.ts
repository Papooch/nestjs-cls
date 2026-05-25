import { AsyncLocalStorage } from 'async_hooks';
import { ClsService } from './cls.service';

const als = new AsyncLocalStorage();
// Establish a root ALS context so that subsequent enterWith() calls in guards
// scope to the current request's async context rather than the global root.
// This mitigates the enterWith() context-leak bug on Node.js < 24
// (fixed upstream in https://github.com/nodejs/node/pull/58029).
als.enterWith(undefined);
export const globalClsService = new ClsService(als);
