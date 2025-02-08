/**
 * Symbol for the Request object stored in the CLS context.
 *
 * Only available in the CLS if the `saveReq` option of `middleware` (`ClsMiddleware`) options
 * is set to `true` (default).
 */
export const CLS_REQ = Symbol('CLS_REQ');
/**
 * Symbol for the Response object stored in the CLS context.
 *
 * Only available in the CLS if the `saveRes` option of `middleware` (`ClsMiddleware`) options
 * is set to `true` (default is `false`).
 */
export const CLS_RES = Symbol('CLS_RES');
/**
 * Symbol for the ID of the CLS context stored in the CLS context.
 *
 * Only available in the CLS if the `generateId` option is set to `true` (default is `false`)
 *
 * Also available via `cls.getId()`
 */
export const CLS_ID = Symbol('CLS_ID');
