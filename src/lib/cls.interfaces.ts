import { CLS_DEFAULT_NAMESPACE } from './cls.constants';

export class ClsModuleOptions {
    /**
     * The name of the cls namespace. This is the namespace
     * that will be used by the ClsService and ClsMiddleware/Interc
     * (most of the time you will not need to touch this setting)
     */
    namespaceName? = CLS_DEFAULT_NAMESPACE;

    /**
     * whether to make the module global, so you don't need
     * to import `ClsModule` in other modules
     */
    global? = false;

    /**
     * Cls middleware options
     */
    middleware?: ClsMiddlewareOptions = null;
}

export class ClsMiddlewareOptions {
    /**
     * whether to mount the middleware/interceptor to every route
     */
    mount?: boolean; // default false

    /**
     * whether to automatically generate request ids
     */
    generateId?: boolean; // default false

    /**
     * the function to generate request ids inside the middleware
     */
    idGenerator?: (req: Request) => string | Promise<string> = () =>
        Math.random().toString(36).slice(-8);

    /**
     * Whether to store the Request object to the cls
     * It will be available under the CLS_REQ key
     */
    saveReq? = true;

    /**
     * Whether to store the Response object to the cls
     * It will be available under the CLS_RES key
     */
    saveRes? = false;

    /**
     * Set to true to set up the context using a call to
     * `AsyncLocalStorage#enterWith` instead of wrapping the
     * `next()` call with the safer `AsyncLocalStorage#run`
     *
     * Most of the time this should not be necessary, but
     * some frameworks are known to lose the context wih `run`.
     */
    useEnterWith? = false;

    readonly namespaceName?: string;
}
