# NestJS CLS (Async Context)

A continuation-local storage module compatible with [NestJS](https://nestjs.com/)' dependency injection based on [AsyncLocalStorage](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage).

> **Notice**: The documentation has been moved to [a dedicated website](https://papooch.github.io/nestjs-cls/).

_Continuation-local storage allows to store state and propagate it throughout callbacks and promise chains. It allows storing data throughout the lifetime of a web request or any other asynchronous duration. It is similar to thread-local storage in other languages._

Some common use cases that this library enables include:

-   Tracking the Request ID and other metadata for logging purposes
-   Keeping track of the user throughout the whole request
-   Making the dynamic Tenant database connection available everywhere in multi-tenant apps
-   Propagating the authentication level or role to restrict access to resources
-   Seamlessly propagating database transaction across services without breaking encapsulation and isolation by explicitly passing it around (**Now available with the [Transactional plugin](https://papooch.github.io/nestjs-cls/plugins/available-plugins/transactional)**)
-   Using "request" context in cases where actual REQUEST-scoped providers are not supported (passport strategies, cron controllers, websocket gateways, ...)

Most of these are to some extent solvable using _REQUEST-scoped_ providers or passing the context as a parameter, but these solutions are often clunky and come with a whole lot of other issues.

---

## Documentation

### ➡️ [Go to the documentation website](https://papooch.github.io/nestjs-cls/) 📖

---

## Contributing

Contributing to a community project is always welcome, please see the [Contributing guide](/CONTRIBUTING.md) :)
