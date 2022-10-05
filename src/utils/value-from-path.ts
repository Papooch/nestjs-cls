import {
    RecursiveKeyOf,
    DeepPropertyType,
} from '../types/recursive-key-of.type';

export function getValueFromPath<T, TP extends RecursiveKeyOf<T> & string>(
    obj: T,
    path: TP,
): DeepPropertyType<T, TP> {
    const pathSegments = path.split('.');
    return pathSegments.reduce((acc, curr) => acc?.[curr], obj);
}

export function setValueFromPath<
    T,
    TP extends RecursiveKeyOf<T> & string,
    V extends DeepPropertyType<T, TP>,
>(obj: T, path: TP, value: V) {
    const pathSegments = path.split('.');
    const leaf = pathSegments.slice(0, -1).reduce((acc, curr) => {
        acc[curr] ?? (acc[curr] = {});
        return acc[curr];
    }, obj ?? {});
    leaf[pathSegments.pop()] = value;
    return obj;
}
