# Module Options

## forRoot(Async)

The `ClsModule.forRoot()` method takes the following **`ClsModuleOptions`**:

- **_`middleware?:`_**`ClsMiddlewareOptions`  
  An object with additional options for the `ClsMiddleware`, see [below](#middleware--enhancer-options).

- **_`guard?:`_**`ClsGuardOptions`  
  An object with additional options for the `ClsGuard`, see [below](#middleware--enhancer-options).

- **_`interceptor?:`_**`ClsInterceptorOptions`  
  An object with additional options for the `ClsInterceptor`, see [below](#middleware--enhancer-options).

- **_`global?:`_**`boolean`\*\* (default _`false`_)  
  Whether to make the module global, so you do not have to import `ClsModule.forFeature()` in other modules.

- **_`proxyProviders?:`_**`Type[]`  
  Array of [Proxy Providers](../03_features-and-use-cases/06_proxy-providers.md) that should be registered in the root module. Currently only accepts sync class Proxy providers, use `ClsModule.forFeatureAsync()` for more complex use-cases.

`ClsModule.forRootAsync()` is also available. You can supply the usual `imports`, `inject` and `useFactory` parameters as usual.

:::info

**Please note**: If you intend to use multiple enhancers at the same time (e.g. initialize the CLS context in a middleware and then set some additional CLS variables in an interceptor), be aware that the only the first one in the chain will set the Request ID.

:::

## forFeature(Async)

The `ClsModule.forFeature()` method can be used to register a [Proxy Providers](../03_features-and-use-cases/06_proxy-providers.md). The Sync method only accepts Class Proxy providers.

The `ClsModule.forFeatureAsync()` method accepts either `ClsModuleProxyClassProviderOptions` or `ClsModuleProxyFactoryProviderOptions` that both accept these options:

- **_`provide?:`_**`any`  
  Custom injection token to use for the provider. In case of a class provider, this parameter is optional, as the class reference passed to `useClass` will be used by default.

- **_`imports?`_**`any[]`  
  Optional list of imported modules that export the providers which are required for the provider.

- **_`extraProviders?:`_**`Provider[]`  
  Optional list of additional providers that should be available to the Proxy. Useful for passing configuration from a parent dynamic module.

The `ClsModuleProxyClassProviderOptions` interface further accepts:

- **_`useClass:`_**`Type`  
  The target class that will be used by this Proxy Provider. Make sure it is decorated with `@InjectableProxy`.

The `ClsModuleProxyFactoryProviderOptions` interface further accepts:

- **_`inject:`_**`any[]`  
  An array of injection tokens for providers used in the `useFactory`.

- **_`useFactory:`_**`(...args: any[]) => any`  
  Factory function that accepts an array of providers in the order of the according tokens in the `inject` array. Returns (or resolves with) an object (or a function) that will be used by this Proxy Provider.

- **_`type?:`_**`'function' | 'object'`  
   Whether the Proxy Provider should be a function or an object. Defaults to `'object'`. See [Caveats](../03_features-and-use-cases/06_proxy-providers.md#caveats) for more information.

- **_`strict?:`_**`boolean`  
   Whether to register this Proxy Provider in [strict mode](../03_features-and-use-cases/06_proxy-providers.md#strict-proxy-providers). Defaults to `false`.

## Middleware & Enhancer options

All of the **`Cls{Middleware,Guard,Interceptor}Options`** take the following parameters (either in `ClsModuleOptions` or directly when instantiating them manually):

- **_`mount?:`_**`boolean` (default _`false`_)  
  Whether to automatically mount the middleware/guard/interceptor to every route (not applicable when instantiating them manually)

- **_`generateId?:`_**`boolean` (default _`false`_)  
  Whether to automatically generate a request ID. It will be available under the `CLS_ID` key.

- **_`idGenerator?:`_**`(req: Request) => string | Promise<string>`  
  **_`idGenerator?:`_**`(ctx: ExecutionContext) => string | Promise<string>`  
  An optional function for generating the request ID. It takes the `Request` object (or the `ExecutionContext` in case of a Guard or Interceptor) as an argument and (synchronously or asynchronously) returns a string. The default implementation uses `Math.random()` to generate a string of 8 characters.

- **_`setup?:`_**`(cls: ClsService, req: Request) => void | Promise<void>;`  
  **_`setup?:`_**`(cls: ClsService, ctx: ExecutionContext) => void | Promise<void>;`  
  Function that executes after the CLS context had been initialised. It can be used to put additional variables in the CLS context.

- **_`resolveProxyProviders?:`_**`boolean` (default _`true`_)  
  Whether to automatically resolve Proxy Providers in the enhancer (if any are registered).

- **_`initializePlugins?:`_**`boolean` (default _`true`_)  
  Whether to run the `onClsInit` hook for plugins as a part of the CLS context registration (runs before `resolveProxyProviders` just after `setup`).

The `ClsMiddlewareOptions` additionally takes the following parameters:

- **_`saveReq?:`_**`boolean` (default _`true`_)  
   Whether to store the _Request_ object to the context. It will be available under the `CLS_REQ` key.

- **_`saveRes?:`_**`boolean` (default _`false`_)  
  Whether to store the _Response_ object to the context. It will be available under the `CLS_RES` key

- **_`useEnterWith?:`_**`boolean` (default _`false`_)  
  Set to `true` to set up the context using a call to [`AsyncLocalStorage#enterWith`](https://nodejs.org/api/async_context.html#async_context_asynclocalstorage_enterwith_store) instead of wrapping the `next()` call with the safer [`AsyncLocalStorage#run`](https://nodejs.org/api/async_context.html#async_context_asynclocalstorage_run_store_callback_args). Most of the time this should not be necessary, but [some frameworks](../05_considerations/02_compatibility.md#graphql) have been known to lose the context with `run`.

The `Cls{Guard,Interceptor}Options` additionally takes the following parameters:

- **_`saveCtx?:`_**`boolean` (default _`true`_) <small>Since `v5.1.0`</small>  
  Whether to store the _ExecutionContext_ object to the context. It will be available under the `CLS_CTX` key.
