# Security

It is often discussed whether [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html) is safe to use for _concurrent requests_ (because of a possible context leak) and whether the context could be _lost_ throughout the duration of a request.

The `ClsMiddleware` and `ClsInterceptor` by default uses the safe `run()` method, which it should not leak context, but in some rare cases, the context can be lost.

The `ClsGuard` (and `ClsMiddleware`, if configured so) uses the less safe `enterWith()` method, which might be needed in case the `run()` method causes context loss.

**This has a consequence that should be taken into account:**

:::caution

When the `enterWith` method is used, any consequent requests _get access_ to the CLS context of the previous request _until the request hits the `enterWith` call_.

:::

That means, when using `ClsMiddleware` with the `useEnterWith` option, or `ClsGuard` to set up context, be sure to mount them as early in the request lifetime as possible and do not use any other enhancers that rely on `ClsService` before them. For `ClsGuard`, that means you should probably manually mount it in `AppModule` if you require any other guard to run _after_ it.

The next chapter addresses compatibility with various transport protocols.
