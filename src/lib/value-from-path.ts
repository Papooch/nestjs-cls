import { RecursiveKeyOf, DeepPropertyType } from '../types/recursive-key-of';

export function valueFromPath<
    T extends any,
    TP extends RecursiveKeyOf<T> & string,
>(obj: T, path: TP): DeepPropertyType<T, TP> {
    const pathSegments = path.split('.');
    return pathSegments.reduce((acc, curr) => acc[curr], obj);
}
