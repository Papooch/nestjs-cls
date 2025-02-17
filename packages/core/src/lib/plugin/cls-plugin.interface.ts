import { ExecutionContext, InjectionToken, Provider } from '@nestjs/common';
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

export type ClsInitContext =
    | ClsMiddlewareInitContext<any, any>
    | ClsEnhancerInitContext
    | ClsDecoratorInitContext<any>
    | ClsCustomInitContext;

export type ClsPluginHooks = {
    beforeSetup?: (
        cls: ClsService,
        context: ClsInitContext,
    ) => void | Promise<void>;

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
}

/**
 * Extend this class to create a new ClsPlugin
 *
 * It contains the basic structure for a plugin, including
 * some helper methods for common operations.
 */
export abstract class ClsPluginBase implements ClsPlugin {
    abstract readonly name: string;

    imports: any[] = [];
    providers: Provider[] = [];
    exports: any[] = [];

    protected get hooksProviderToken() {
        return getPluginHooksToken(this.name);
    }

    protected registerHooks(opts: {
        inject: InjectionToken<any>[];
        useFactory: (...args: any[]) => ClsPluginHooks;
    }) {
        this.providers.push({
            provide: this.hooksProviderToken,
            inject: opts.inject,
            useFactory: opts.useFactory,
        });
        this.exports.push(this.hooksProviderToken);
    }
}

export function getPluginHooksToken(name: string) {
    return `CLS_PLUGIN_${name}_HOOKS`;
}
