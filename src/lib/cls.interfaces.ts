import { ExecutionContext } from '@nestjs/common';
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
     * additional middleware options
     * (should not be combined with interceptor)
     */
    middleware?: ClsMiddlewareOptions = null;

    /**
     * additional interceptor options
     * (should not be combined with middleware)
     */
    interceptor?: ClsInterceptorOptions = null;
}

class ClsMiddlewareOrInterceptorOptions {
    /**
     * whether to mount the middleware/interceptor to every route
     */
    mount?: boolean; // default false

    /**
     * whether to automatically generate request ids
     */
    generateId?: boolean; // default false

    readonly namespaceName?: string;
}

export class ClsMiddlewareOptions extends ClsMiddlewareOrInterceptorOptions {
    /**
     * the function to generate request ids inside the middleware
     */
    idGenerator?: (req: Request) => string | Promise<string>;

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
}

export class ClsInterceptorOptions extends ClsMiddlewareOrInterceptorOptions {
    /**
     * the function to generate request ids inside the interceptor
     */
    idGenerator?: (context: ExecutionContext) => string | Promise<string>;
}
