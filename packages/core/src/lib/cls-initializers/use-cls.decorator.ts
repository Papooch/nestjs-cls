import 'reflect-metadata';
import { ClsServiceManager } from '../cls-service-manager';
import { CLS_ID } from '../cls.constants';
import { ClsDecoratorOptions } from '../cls.options';

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
        const options = { ...new ClsDecoratorOptions(), ...maybeOptions };
        const cls = ClsServiceManager.getClsService();
        const original = descriptor.value;
        // console.log('original is', original?.toString());
        if (typeof original !== 'function') {
            throw new Error(
                `The @UseCls decorator can be only used on functions, but ${propertyKey.toString()} is not a function.`,
            );
        }
        descriptor.value = function (...args: TArgs) {
            return cls.run(async () => {
                if (options.generateId) {
                    const id = await options.idGenerator?.apply(this, args);
                    cls.set<string>(CLS_ID, id);
                }
                if (options.setup) {
                    await options.setup.apply(this, [cls, ...args]);
                }
                if (options.initializePlugins) {
                    await cls.initializePlugins();
                }
                if (options.resolveProxyProviders) {
                    await cls.resolveProxyProviders();
                }
                return original.apply(this, args);
            });
        };
        copyMetadata(original, descriptor.value);
    };
}

/**
 * Copies all metadata from one object to another.
 * Useful for overwriting function definition in
 * decorators while keeping all previously
 * attached metadata
 *
 * @param from object to copy metadata from
 * @param to object to copy metadata to
 */
function copyMetadata(from: any, to: any) {
    const metadataKeys = Reflect.getMetadataKeys(from);
    metadataKeys.map((key) => {
        const value = Reflect.getMetadata(key, from);
        Reflect.defineMetadata(key, value, to);
    });
}
