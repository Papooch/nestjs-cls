import { ExecutionContext, Provider } from '@nestjs/common';
import { ClsService } from '../cls.service';

export interface ClsMiddlewareInitContext<TRequest = any, TResponse = any> {
    kind: 'middleware';
    req: TRequest;
    res: TResponse;
}

export interface ClsEnhancerInitContext {
    kind: 'interceptor' | 'guard';
    ctx: ExecutionContext;
}

export interface ClsDecoratorInitContext<TArgs extends any[] = any[]> {
    kind: 'decorator';
    args: TArgs;
}

export interface ClsCustomInitContext {
    kind: 'custom';
    [key: string]: any;
}

/**
 * The object passed to the plugin hooks, when the CLS is being initialized
 *
 * The `kind` property is used to determine the context (enhancer) in which
 * the plugin is being initialized and the other properties are specific to the context.
 */
export type ClsInitContext =
    | ClsMiddlewareInitContext<any, any>
    | ClsEnhancerInitContext
    | ClsDecoratorInitContext<any>
    | ClsCustomInitContext;

export type ClsPluginHooks = {
    /**
     * A function that is called before the `setup` function of an enhancer is called
     */
    beforeSetup?: (
        cls: ClsService,
        context: ClsInitContext,
    ) => void | Promise<void>;

    /**
     * A unction that is called after the `setup` function of an enhancer is called
     */
    afterSetup?: (
        cls: ClsService,
        context: ClsInitContext,
    ) => void | Promise<void>;
};

/**
 * Implement this interface to create a new ClsPlugin
 *
 * Hint: Extend {@link ClsPluginBase} instead of implementing this interface directly
 */
export interface ClsPlugin {
    readonly name: string;
    imports?: any[];
    providers?: Provider[];
    exports?: any[];

    onModuleInit?: () => void | Promise<void>;
    onModuleDestroy?: () => void | Promise<void>;
    onApplicationBootstrap?: () => void | Promise<void>;
    onApplicationShutdown?: (signal?: string) => void | Promise<void>;
    beforeApplicationShutdown?: (signal?: string) => void | Promise<void>;
}
