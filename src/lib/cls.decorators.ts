import { Inject } from '@nestjs/common';
import { CLS_DEFAULT_NAMESPACE } from '..';
import {
    getDefaultNamespace,
    getNamespace,
    getNamespaceToken,
} from './cls.globals';
import { copyMetadata } from './copy-metadata';

export const InjectCls = (namespace: string) =>
    Inject(getNamespaceToken(namespace));

class UseClsOptions {
    name? = CLS_DEFAULT_NAMESPACE;
    reuseIfActive? = true;
}

export const UseCls =
    (options?: UseClsOptions) =>
    (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const original: (...args: any[]) => any = descriptor.value;
        const augmented = function (this: any, ...args: any[]) {
            const opts = { ...new UseClsOptions(), ...options };
            const namespace = opts.name
                ? getNamespace(opts.name)
                : getDefaultNamespace();
            if (namespace.active && opts.reuseIfActive) {
                return original.apply(this, args);
            }
            return namespace.runAndReturn(() => original.apply(this, args));
        };
        copyMetadata(original, augmented);
        descriptor.value = augmented;
    };
