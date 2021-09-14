import { createNamespace, Namespace } from 'cls-hooked';

export const getNamespaceToken = (namespace: string) =>
    `ClsService-${namespace}`;

export const namespaces: Record<string, Namespace> = {};

export function resolveNamespace(name: string) {
    if (!namespaces[name]) {
        namespaces[name] = createNamespace(name);
    }
    return namespaces[name];
}

export function getNamespace(name: string) {
    const ns = namespaces[name];
    if (!ns) throw new Error(`Cls namespace ${name} does not exist`);
    return ns;
}

export let defaultNamespaceName = 'CLS_DEFAULT_NAMESPACE';

export function setDefaultNamespace(name: string) {
    defaultNamespaceName = name;
    return resolveNamespace(defaultNamespaceName);
}
export function getDefaultNamespace() {
    return resolveNamespace(defaultNamespaceName);
}
