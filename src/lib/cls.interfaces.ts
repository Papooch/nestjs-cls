import { ExecutionContext, ModuleMetadata } from '@nestjs/common';
import { CLS_DEFAULT_NAMESPACE } from './cls.constants';
import { ClsService } from './cls.service';

export class ClsModuleOptions {
    /**
     * whether to make the module global, so you don't need
     * to import ClsModule.forFeature()` in other modules
     */
    global? = false;

    /**
     * An object with additional options for the `ClsMiddleware`
     */
    middleware?: ClsMiddlewareOptions = null;

    /**
     * An object with additional options for the `ClsGuard`
     */
    guard?: ClsGuardOptions = null;

    /**
     * An object with additional options for the `ClsInterceptor`
     */
    interceptor?: ClsInterceptorOptions = null;

    /**
     * The namespace that will be set up. When used, `ClsService`
     * must be injected using the `@InjectCls('name')` decorator.
     * (most of the time you will not need to touch this setting)
     */
    namespaceName? = CLS_DEFAULT_NAMESPACE;
}

export type ClsModuleFactoryOptions = Omit<
    ClsModuleOptions,
    'global' | 'namespaceName'
>;
export interface ClsModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    inject?: any[];
    useFactory?: (
        ...args: any[]
    ) => Promise<ClsModuleFactoryOptions> | ClsModuleFactoryOptions;
    /**
     * whether to make the module global, so you don't need
     * to import `ClsModule.forFeature()` in other modules
     */
    global?: boolean;
    /**
     * The namespace that will be set up. When used, `ClsService`
     * must be injected using the `@InjectCls('name')` decorator.
     * (most of the time you will not need to touch this setting)
     */
    namespaceName?: string;
}

export class ClsMiddlewareOptions {
    /**
     * whether to mount the middleware to every route
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
     * Function that executes after the CLS context has been initialised.
     * It can be used to put additional variables in the CLS context.
     */
    setup?: (cls: ClsService, req: Request) => void | Promise<void>;

    /**
     * Whether to store the Request object to the CLS
     * It will be available under the CLS_REQ key
     */
    saveReq? = true;

    /**
     * Whether to store the Response object to the CLS
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

export class ClsGuardOptions {
    /**
     * whether to mount the guard globally
     */
    mount?: boolean; // default false

    /**
     * whether to automatically generate request ids
     */
    generateId?: boolean; // default false

    /**
     * the function to generate request ids inside the guard
     */
    idGenerator?: (context: ExecutionContext) => string | Promise<string> =
        () => Math.random().toString(36).slice(-8);

    /**
     * Function that executes after the CLS context has been initialised.
     * It can be used to put additional variables in the CLS context.
     */
    setup?: (
        cls: ClsService,
        context: ExecutionContext,
    ) => void | Promise<void>;

    readonly namespaceName?: string;
}

export class ClsInterceptorOptions {
    /**
     * whether to mount the interceptor globally
     */
    mount?: boolean; // default false

    /**
     * whether to automatically generate request ids
     */
    generateId?: boolean; // default false

    /**
     * the function to generate request ids inside the interceptor
     */
    idGenerator?: (context: ExecutionContext) => string | Promise<string> =
        () => Math.random().toString(36).slice(-8);

    /**
     * Function that executes after the CLS context has been initialised.
     * It can be used to put additional variables in the CLS context.
     */
    setup?: (
        cls: ClsService,
        context: ExecutionContext,
    ) => void | Promise<void>;

    readonly namespaceName?: string;
}

export interface ClsStore {
    [key: symbol]: any;
}
