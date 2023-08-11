/**
 * If the condition type (C) extends (E), return T, else E2
 */
export type TypeIfType<C, E, T, T2> = [C] extends [E] ? T : T2;

/**
 * If the condition type (C) extends (E), return T, else E2
 */
export type TypeIfSymbol<C, T, T2> = [C] extends [symbol] ? T : T2;

/**
 * If the condition type (C) is `undefined`, return T, else T2
 */
export type TypeIfUndefined<C, T, T2> = [C] extends [undefined] ? T : T2;

/**
 * If the condition type (C) is `never`, return T, else C
 */
export type TypeIfNever<C, T> = [C] extends [never] ? T : C;

/**
 * If the condition type (C) is `never`, return `string`, else C
 */
export type AnyIfNever<C> = TypeIfNever<C, any>;

/**
 * If the condition type (C) is `never`, return `any`, else C
 */
export type StringIfNever<C> = TypeIfNever<C, string>;
