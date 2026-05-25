# Security

It is often discussed whether [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html) is safe to use for _concurrent requests_ (because of a possible context leak) and whether the context could be _lost_ throughout the duration of a request.

The `ClsMiddleware` and `ClsInterceptor` by default use the safe `run()` method, which does not leak context, but in some rare cases, the context can be lost.

The `ClsGuard` (and `ClsMiddleware`, if configured so) uses the less safe `enterWith()` method, which might be needed in case the `run()` method causes context loss.

**This has a consequence that should be taken into account:**

:::caution

When the `enterWith` method is used, any consequent requests _get access_ to the CLS context of the previous request _until the request hits the `enterWith` call_.

:::

That means, when using `ClsMiddleware` with the `useEnterWith` option, or `ClsGuard` to set up context, be sure to mount them as early in the request lifetime as possible and do not use any other enhancers that rely on `ClsService` before them. For `ClsGuard`, that means you should probably manually mount it in `AppModule` if you require any other guard to run _after_ it.

:::note

Since **Node.js 24+**, `enterWith` was [fixed in Node.js 24](https://github.com/nodejs/node/pull/58029) and no longer leaks context.

On older Node.js versions, `nestjs-cls >= 6.2.1` automatically calls `als.enterWith(undefined)` at module initialization to establish a root ALS context, which also fixes the problem.

Only `nestjs-cls <= 6.2.0` running on `Node < 24` have this vulerability.

:::

The next chapter addresses compatibility with various transport protocols.
