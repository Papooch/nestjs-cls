const TERMINAL_BRAND = Symbol();
export class BrandedTerminal {
    private [TERMINAL_BRAND]?: void;
}

/**
 * Use the terminal type to prevent generation of property
 * paths to nested properties of the type within the ClsStore
 */
export type Terminal<T> = T & BrandedTerminal;
