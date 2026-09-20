/**
 * Symbol for the Request object stored in the CLS context.
 *
 * Only available in the CLS if the `saveReq` option of `middleware` (`ClsMiddleware`) options
 * is set to `true` (default).
 */
export const CLS_REQ = Symbol.for('nestjs-cls:CLS_REQ');
/**
 * Symbol for the Response object stored in the CLS context.
 *
 * Only available in the CLS if the `saveRes` option of `middleware` (`ClsMiddleware`) options
 * is set to `true` (default is `false`).
 */
export const CLS_RES = Symbol.for('nestjs-cls:CLS_RES');
/**
 * Symbol for the CLS ExecutionContext object stored in the CLS context.
 *
 * Only available if the `saveCtx` options of either `interceptor` (ClsInterceptor) or
 * `guard` (ClsGuard) options is set to `true` (default).
 */
export const CLS_CTX = Symbol.for('nestjs-cls:CLS_CTX');
/**
 * Symbol for the ID of the CLS context stored in the CLS context.
 *
 * Only available in the CLS if the `generateId` option is set to `true` (default is `false`)
 *
 * Also available via `cls.getId()`
 */
export const CLS_ID = Symbol.for('nestjs-cls:CLS_ID');
