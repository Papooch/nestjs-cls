import { ExecutionContext, ModuleMetadata, Type } from '@nestjs/common';
import type { ClsService } from './cls.service';
import { ClsPlugin } from './plugin/cls-plugin.interface';

const getRandomString = () => Math.random().toString(36).slice(-8);

export class ClsModuleOptions {
    /**
     * whether to make the module global, so you don't need
     * to import ClsModule.forFeature()` in other modules
     */
    global? = false;

    /**
     * An object with additional options for the `ClsMiddleware`
     */
    middleware?: ClsMiddlewareOptions;

    /**
     * An object with additional options for the `ClsGuard`
     */
    guard?: ClsGuardOptions;

    /**
     * An object with additional options for the `ClsInterceptor`
     */
    interceptor?: ClsInterceptorOptions;

    /**
     * Array of Proxy Provider classes to register
     */
    proxyProviders?: Type[];

    /**
     * Array of ClsPlugin instances to register
     */
    plugins?: ClsPlugin[];
}

export type ClsModuleFactoryOptions = Omit<
    ClsModuleOptions,
    'global' | 'proxyProviders' | 'plugins'
>;
export interface ClsModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    inject?: any[];
    useFactory: (
        ...args: any[]
    ) => Promise<ClsModuleFactoryOptions> | ClsModuleFactoryOptions;
    /**
     * whether to make the module global, so you don't need
     * to import `ClsModule.forFeature()` in other modules
     */
    global?: boolean;

    /**
     * Array of Proxy Provider classes to register
     */
    proxyProviders?: Type[];

    /**
     * Array of ClsPlugin instances to register
     */
    plugins?: ClsPlugin[];
}

export class ClsContextOptions {
    /**
     * Sets the behavior of nested CLS context creation. Has no effect if no parent context exists.
     *
     * `inherit` (default) - Run the callback with a shallow copy of the parent context.
     * Assignments to top-level properties will not be reflected in the parent context.
     *
     * `reuse` - Reuse existing context without creating a new one.
     *
     * `override` - Run the callback with an new empty context.
     * Warning: No values from the parent context will be accessible.
     */
    ifNested?: 'inherit' | 'reuse' | 'override' = 'inherit';
}

export class ClsInitializerCommonOptions {
    /**
     * whether to automatically generate request ids
     */
    generateId?: boolean; // default false

    /**
     * Whether to resolve proxy providers as a part
     * of the CLS context registration
     *
     * Default: `true`
     */
    resolveProxyProviders? = true;

    /**
     * Whether to run the onClsInit hook for plugins as a part
     * of the CLS context registration (runs before `resolveProxyProviders` just after `setup`)
     *
     * Default: `true`
     */
    initializePlugins? = true;
}

export class ClsMiddlewareOptions extends ClsInitializerCommonOptions {
    /**
     * whether to mount the middleware to every route
     */
    mount?: boolean; // default false

    /**
     * the function to generate request ids for the CLS context
     */
    idGenerator?: (req: any) => string | Promise<string> = getRandomString;

    /**
     * Function that executes after the CLS context has been initialized.
     * It can be used to put additional variables in the CLS context.
     */
    setup?: (cls: ClsService, req: any, res: any) => void | Promise<void>;

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
}

export class ClsGuardOptions extends ClsInitializerCommonOptions {
    /**
     * whether to mount the guard globally
     */
    mount?: boolean; // default false

    /**
     * the function to generate request ids inside the guard
     */
    idGenerator?: (context: ExecutionContext) => string | Promise<string> =
        getRandomString;

    /**
     * Function that executes after the CLS context has been initialised.
     * It can be used to put additional variables in the CLS context.
     */
    setup?: (
        cls: ClsService,
        context: ExecutionContext,
    ) => void | Promise<void>;
}

export class ClsInterceptorOptions extends ClsInitializerCommonOptions {
    /**
     * whether to mount the interceptor globally
     */
    mount?: boolean; // default false

    /**
     * the function to generate request ids inside the interceptor
     */
    idGenerator?: (context: ExecutionContext) => string | Promise<string> =
        getRandomString;

    /**
     * Function that executes after the CLS context has been initialised.
     * It can be used to put additional variables in the CLS context.
     */
    setup?: (
        cls: ClsService,
        context: ExecutionContext,
    ) => void | Promise<void>;
}

export class ClsDecoratorOptions<
    T extends any[],
> extends ClsInitializerCommonOptions {
    /**
     * Additional options for the `ClsService#run` method.
     */
    runOptions?: ClsContextOptions;

    /**
     * The function to generate request ids inside the interceptor.
     *
     * Takes the same parameters in the same order as the decorated function.
     *
     * If you use a `function` expression, it will executed with the `this` context of the decorated class instance.
     * to get type safety, use:
     *
     * `idGenerator: function (this: MyClass, ...args) { ... }`
     *
     * Note: To avoid type errors, you must list all parameters, even if they're not used,
     * or type the decorator as:
     *
     * `@UseCls<[arg1: Type1, arg2: Type2]>()`
     */
    idGenerator?: (...args: T) => string | Promise<string> = getRandomString;

    /**
     * Function that executes after the CLS context has been initialized.
     * Takes ClsService as the first parameter and then the same parameters in the same order as the decorated function.
     *
     * If you use a `function` expression, it will executed with the `this` context of the decorated class instance.
     * to get type safety, use:
     *
     * `setup: function (this: MyClass, cls: ClsService, ...args) { ... }`
     *
     * Note: To avoid type errors, you must list all parameters, even if they're not used,
     * or type the decorator as:
     *
     * `@UseCls<[arg1: Type1, arg2: Type2]>()`
     */
    setup?: (cls: ClsService, ...args: T) => void | Promise<void>;
}

export interface ClsStore {
    [key: symbol]: any;
}
