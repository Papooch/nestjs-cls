import { BrandedTerminal } from './terminal.type';

type TerminalType =
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | any[]
    | Map<any, any>
    | Set<any>
    | Date
    | RegExp
    | BrandedTerminal
    | ((...args: any) => any);

/**
 * Deep nested keys of an interface with dot syntax
 *
 * @example
 * type t = RecursiveKeyOf<{a: {b: {c: string}}> // => 'a' | 'a.b' | 'a.b.c'
 */
export type RecursiveKeyOf<
    T,
    Prefix extends string = never,
> = T extends TerminalType
    ? never
    : {
          [K in keyof T & string]: [Prefix] extends [never]
              ? K | RecursiveKeyOf<T[K], K>
              : `${Prefix}.${K}` | RecursiveKeyOf<T[K], `${Prefix}.${K}`>;
      }[keyof T & string];

/**
 * Get the type of a nested property with dot syntax
 *
 * Basically the inverse of `RecursiveKeyOf`
 *
 * @example
 * type t = DeepPropertyType<{a: {b: {c: string}}}, 'a.b.c'> // => string
 */
export type DeepPropertyType<
    T,
    P extends RecursiveKeyOf<T>,
> = P extends `${infer Prefix}.${infer Rest}`
    ? Prefix extends keyof T
        ? Rest extends RecursiveKeyOf<T[Prefix]>
            ? DeepPropertyType<T[Prefix], Rest>
            : never
        : never
    : P extends keyof T
    ? T[P]
    : never;
