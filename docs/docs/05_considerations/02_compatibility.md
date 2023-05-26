# Compatibility

The table below outlines the compatibility with some platforms:

|                                                                |                            REST                            | GQL |         WS         | Microservices |
| :------------------------------------------------------------: | :--------------------------------------------------------: | :-: | :----------------: | :-----------: |
|                       **ClsMiddleware**                        |                             ✔                              |  ✔  |         ✖          |       ✖       |
|              **ClsGuard** <br/>(uses `enterWith`)              |                             ✔                              |  ✔  | ✔[\*](#websockets) |       ✔       |
| **ClsInterceptor** <br/>(context inaccessible<br/>in _Guards_) | ✔<br/>context also inaccessible<br/>in _Exception Filters_ |  ✔  | ✔[\*](#websockets) |       ✔       |

## REST

This package is compatible with Nest-supported REST controllers and the preferred way is to use the `ClsMiddleware` with the `mount` option set to `true`.

Tested with:

-   ✔ Express
-   ✔ Fastify

Known issues:

-   In case API versioning is used, the automatic mounting of the `ClsMiddleware` does not work and it needs to be mounted manually. See issue [#67](https://github.com/Papooch/nestjs-cls/issues/67) for details.
-   Some existing Express middlewares may cause context loss, if that happens, mount the `ClsMiddleware` manually _after_ those offending ones ([#50](https://github.com/Papooch/nestjs-cls/issues/50#issuecomment-1368162870))

## GraphQL

Using an interceptor or a guard may result in that enhancer triggering multiple times in case there are multiple queries in the GQL request. Due to this, you should ensure that any operation on the CLS store within enhancers is _idempotent_. This includes the `setup` function.

Tested with:

-   ✔ Apollo (Express)
-   ✔ Mercurius (Fastify)

### `@nestjs/graphql >= 10`,

Since v10, this package is compatible with GraphQL resolvers and the preferred way is to use the `ClsMiddleware` with the `mount` option.

### `@nestjs/graphql < 10`

For older versions of graphql, the `ClsMiddleware` needs to be [mounted manually](../02_setting-up-cls-context/01_using-a-middleware.md#manually) with `app.use(...)` in order to correctly set up the context for resolvers. Additionally, you have to pass `useEnterWith: true` to the `ClsMiddleware` options, because the context gets lost otherwise due to [an issue with CLS and Apollo](https://github.com/apollographql/apollo-server/issues/2042) (sadly, the same is true for [Mercurius](https://github.com/Papooch/nestjs-cls/issues/1)). This method is functionally identical to just using the `ClsGuard`.

Alternatively, you can use the `ClsInterceptor`, which uses the safer `AsyncLocalStorage#run` (thanks to [andreialecu](https://github.com/Papooch/nestjs-cls/issues/5)), but remember that using it makes CLS unavailable in _Guards_.

## Others

Use the `ClsGuard` or `ClsInterceptor` to set up context with any other platform.

There are no explicit test for other transports, so I can't guarantee it will work with your platform of choice, but there's nothing that would indicate otherwise.

> If you decide to try this package with a platform that is not listed here, **please let me know** so I can add the compatibility notice.

Below are listed transports with which it is confirmed to work:

### Websockets

_Websocket Gateways_ don't respect globally bound enhancers, therefore it is required to bind the `ClsGuard` or `ClsInterceptor` manually on the `WebsocketGateway`. Special care is also needed for the `handleConnection` method (See [#8](https://github.com/Papooch/nestjs-cls/issues/8))
