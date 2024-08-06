import { ContextType, ExecutionContext } from '@nestjs/common';
import { ClsStore } from '../../cls.options';

/**
 * This static class can be used to save the CLS store in a WeakMap based on the ExecutionContext
 * or any object that is passed to the `setByRawContext` method.
 *
 * It is used internally by the `ClsMiddleware`, `ClsInterceptor` and `ClsGuard` to prevent
 * instantiating the context multiple times for the same request.
 *
 * It can also be used as an escape hatch to retrieve the CLS store based on the ExecutionContext
 * or the "raw context" when the ExecutionContext is not available.
 * * For HTTP, it is the Request (@Req) object
 * * For WS, it is the data object
 * * For RPC (microservices), it is the RpcContext (@Ctx) object
 * * For GraphQL, it is the GqlContext object
 */
export class ContextClsStoreMap {
    private static readonly contextMap = new WeakMap<any, ClsStore>();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}
    static set(context: ExecutionContext, value: ClsStore): void {
        const ctx = this.getContextByType(context);
        this.contextMap.set(ctx, value);
    }
    static get(context: ExecutionContext): ClsStore | undefined {
        const ctx = this.getContextByType(context);
        return this.contextMap.get(ctx);
    }
    static setByRaw(ctx: any, value: ClsStore): void {
        this.contextMap.set(ctx, value);
    }
    static getByRaw(ctx: any): ClsStore | undefined {
        return this.contextMap.get(ctx);
    }

    private static getContextByType(context: ExecutionContext): any {
        switch (context.getType() as ContextType | 'graphql') {
            case 'http':
                return context.switchToHttp().getRequest();
            case 'ws':
                return context.switchToWs();
            case 'rpc':
                return context.switchToRpc().getContext();
            case 'graphql':
                // As per the GqlExecutionContext, the context is the second argument
                return context.getArgByIndex(2);
            default:
                return {};
        }
    }
}
