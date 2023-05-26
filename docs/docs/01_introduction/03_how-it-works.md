# How it works

Continuation-local storage provides a common space for storing and retrieving data throughout the life of a function/callback call chain. In NestJS, this allows for sharing request data across the lifetime of a single request - without the need for request-scoped providers. It also makes it easy to track and log request ids throughout the whole application.

To make CLS work, it is required to set up the CLS context first. This is done by calling `cls.run()` (or `cls.enter()`, see [Security considerations](../05_considerations/01_security.md) for more info) somewhere in the app. Once that is set up, anything that is called within the same callback chain has access to the same storage with `cls.set()` and `cls.get()`.
