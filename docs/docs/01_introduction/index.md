---
slug: /
sidebar_position: 0
title: Introduction
---

# NestJS CLS

A continuation-local\* storage module compatible with [NestJS](https://nestjs.com/)' dependency injection based on Node's [AsyncLocalStorage](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage).

> _Continuation-local storage allows to store state and propagate it throughout callbacks and promise chains. It allows storing data throughout the lifetime of a web request or any other asynchronous duration. It is similar to thread-local storage in other languages._

## Use cases

Some common use cases that this library enables include:

-   Tracking the Request ID and other metadata for logging purposes
-   Keeping track of the user throughout the whole request
-   Making the dynamic Tenant database connection available everywhere in multi-tenant apps
-   Propagating the authentication level or role to restrict access to resources
-   Seamlessly propagating database transaction across services without breaking encapsulation and isolation by explicitly passing it around (**Now available with the [Transactional plugin](../06_plugins/01_available-plugins/01-transactional/index.md)**)
-   Using "request" context in cases where actual REQUEST-scoped providers are not supported (passport strategies, cron controllers, websocket gateways, ...)

Most of these are to some extent solvable using _REQUEST-scoped_ providers or passing the context as a parameter, but these solutions are often clunky and come with a whole lot of other issues.

:::info

\* The name comes from the original implementation based on `cls-hooked`, which was since replaced by the native `AsyncLocalStorage`.

:::

## Motivation

_NestJS is an amazing framework, but in the plethora of awesome built-in features, I still missed one_.

_I created this library to solve a specific use case, which was limiting access to only those records which had the same TenantId as the request's user in a central manner. The repository code automatically added a `WHERE` clause to each query, which made sure that other developers couldn't accidentally mix tenant data (all tenants' data were held in the same database) without extra effort._

_`AsyncLocalStorage` is still fairly new and not many people know of its existence and benefits. Here's a nice [talk from NodeConf](https://youtu.be/R2RMGQhWyCk?t=9742) about the history. I've invested a great deal of my personal time in making the use of it as pleasant as possible._

_While the use of `async_hooks` is sometimes criticized for [making Node run slower](https://gist.github.com/Aschen/5cc1f3f3b58f1e284b670b83bb53da7d), in my experience, the introduced overhead is negligible compared to any IO operation (like a DB or external API call). If you want speed, use a compiled language._

_Also, if you use some tracing library (like `otel`), it most likely already uses `async_hooks` under the hood, so you might as well use it to your advantage._

## Highlights

> **New** Version `5.0` adds support for NestJS v11 (See [5.x Migration guide](../10_migration-guide/01_v4x-v5x.md) for breaking changes and the [Version compatibility matrix](../05_considerations/02_compatibility.md#nestjs-related-versions-compatibility-matrix) when performing an update).

> Version `4.0` brings support for [Plugins](../06_plugins/index.md) which enable pre-built integrations with other libraries and frameworks. (See [4.x Migration guide](../10_migration-guide/02_v3x-v4x.md) for breaking changes).

> Version `3.0` introduces [_Proxy Providers_](../03_features-and-use-cases/06_proxy-providers.md) as an alternative to the imperative API. (Minor breaking changes were introduced, see [3.x Migration guide](../10_migration-guide/03_v2x-v3x.md)).

> Version `2.0` brings advanced [type safety and type inference](../03_features-and-use-cases/05_type-safety-and-type-inference.md). However, it requires features from `typescript >= 4.4` - Namely allowing `symbol` members in interfaces. If you can't upgrade but still want to use this library, install version `1.6.2`, which lacks the typing features.
