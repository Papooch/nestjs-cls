# Service Interface

## ClsService

The injectable `ClsService` provides the following API to manipulate the cls context:

The `S` type parameter is used as the type of custom `ClsStore`.

- **_`get`_**`(): S`  
  Get the entire CLS context.

- **_`get`_**`(key?: keyof S): S[key]`  
  Retrieve a value from the CLS context by key.

- **_`getId`_**`(): string;`  
  Retrieve the request ID (a shorthand for `cls.get(CLS_ID)`)

- **_`has`_**`(key: keyof S): boolean`  
  Check if a key is in the CLS context.

- **_`set`_**`(key: keyof S, value: S[key]): void`  
  Set a value on the CLS context.

- **_`setIfUndefined`_**`(key: keyof S, value: S[key]): void`  
  Set a value on the CLS context _only_ if it hasn't been already set. Useful for ensuring idempotence if you have multiple entry points.

- **_`run`_**`(callback: () => T): T`  
  **_`run`_**`(options: ClsContextOptions, callback: () => T): T;`  
  Run the callback in a shared CLS context. Optionally takes an [options object](#clscontextoptions) as the first parameter.

- **_`runWith`_**`(store: S, callback: () => T): T`  
  Run the callback in a new CLS context (while supplying the default store).

- **_`enter`_**`(): void;`  
  **_`enter`_**`(options: ClsContextOptions): void`  
  Run any following code in a shared CLS context. Optionally takes an [options object](#clscontextoptions) as the first parameter.

- **_`enterWith`_**`(store: S): void`  
  Run any following code in a new CLS context (while supplying the default store).

- **_`exit`_**`(callback: () => T): T`  
  Run the callback _without_ access to a shared CLS context.

- **_`isActive`_**`(): boolean`  
  Whether the current code runs within an active CLS context.

The following methods only apply to the [Proxy](../03_features-and-use-cases/06_proxy-providers.md) feature:

- **_`proxy`_**`ClsProxyAccessors`  
  An interface for accessing instances of Proxy providers with the following methods:
    - **_`get`_**`(proxyToken: any): any`  
      Retrieve a Proxy provider from the CLS context based on its injection token.
    - **_`set`_**`(proxyToken: any, value?: any): any`  
       Replace an instance of a Proxy provider in the CLS context based on its injection token.
    - **_`resolve`_**`(proxyTokens?: any[]): Promise<void>`  
      Manually trigger resolution of registered Proxy Providers. If an array of injection tokens is provided, resolves only those Proxy Providers.

## ClsContextOptions

The `run` and `enter` methods can take an additional options object with the following settings:

- **_`ifNested?:`_**`'inherit' | 'reuse' | 'override'`  
  Sets the behavior of nested CLS context creation in case the method is invoked in an existing context. It has no effect if no parent context exist.
    - `inherit` (default) - Run the callback with a shallow copy of the parent context.  
      Re-assignments of top-level properties will not be reflected in the parent context. However, modifications of existing properties _will_ be reflected.
    - `reuse` - Reuse existing context without creating a new one. All modifications to the
      existing context will be reflected.
    - `override` - Run the callback with an new empty context.  
      No values from the parent context will be accessible within the wrapped code.

::: Note

Until `v4`, the default behavior was `override`. This was changed to `inherit` since `v4` to make the behavior more intuitive.

:::
