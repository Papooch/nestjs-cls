import { Inject } from '@nestjs/common';
import 'reflect-metadata';
import { copyMethodMetadata } from '../../utils/copy-method-metadata';
import { ClsServiceManager } from '../cls-service-manager';
import { CLS_ID } from '../cls.constants';
import { ClsDecoratorOptions } from '../cls.options';
import { ClsDecoratorInitContext } from '../plugin/cls-plugin.interface';
import { ClsPluginsHooksHost } from '../plugin/cls-plugins.module';

const pluginHooksHostProperty = `__pluginHooksHost`;

/**
 * Wraps the decorated method in a CLS context.
 */
export function UseCls(): (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: any) => Promise<any>>,
) => void;

/**
 * Wraps the decorated method in a CLS context.
 *
 * @param options takes similar options to the enhancers.
 */
export function UseCls<TArgs extends any[]>(
    options: ClsDecoratorOptions<TArgs>,
): (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: TArgs) => Promise<any>>,
) => void;

export function UseCls<TArgs extends any[]>(
    maybeOptions?: ClsDecoratorOptions<TArgs>,
) {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<(...args: TArgs) => Promise<any>>,
    ) => {
        if (!target[pluginHooksHostProperty]) {
            Inject(ClsPluginsHooksHost)(target, pluginHooksHostProperty);
        }

        const options = { ...new ClsDecoratorOptions(), ...maybeOptions };
        const cls = ClsServiceManager.getClsService();
        const original = descriptor.value;
        if (typeof original !== 'function') {
            throw new Error(
                `The @UseCls decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`,
            );
        }
        descriptor.value = new Proxy(original, {
            apply: function (_, outerThis, args: TArgs[]) {
                return cls.run(options.runOptions ?? {}, async () => {
                    const pluginCtx: ClsDecoratorInitContext = {
                        kind: 'decorator',
                        args,
                    };
                    if (options.initializePlugins) {
                        outerThis[pluginHooksHostProperty]?.beforeSetup(
                            pluginCtx,
                        );
                    }
                    if (options.generateId) {
                        const id = await options.idGenerator?.apply(
                            outerThis,
                            args,
                        );
                        cls.set<string>(CLS_ID, id);
                    }
                    if (options.setup) {
                        await options.setup.apply(outerThis, [cls, ...args]);
                    }
                    if (options.initializePlugins) {
                        outerThis[pluginHooksHostProperty]?.afterSetup(
                            pluginCtx,
                        );
                    }
                    if (options.resolveProxyProviders) {
                        await cls.resolveProxyProviders();
                    }
                    return original.apply(outerThis, args);
                });
            },
        });
        copyMethodMetadata(original, descriptor.value);
    };
}
