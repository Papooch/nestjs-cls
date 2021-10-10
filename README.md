# NestJS CLS

A continuation-local storage module compatible with [NestJS](https://nestjs.com/)'s dependency injection.

> Note: For versions < 1.2, this package used [cls-hooked](https://www.npmjs.com/package/cls-hooked) as a peer dependency, now it uses [AsyncLocalStorage](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage) from Node's `async_hooks` directly. The API stays the same for now but I'll consider making it more friendly for version 2.

# Outline

-   [Install](#install)
-   [Quick Start](#quick-start)
-   [How it works](#how-it-works)
    -   [HTTP](#http)
    -   [Non-HTTP](#non-http)
-   [API](#api)
-   [Options](#options)
-   [Request ID](#request-id)
-   [Additional CLS Setup](#additional-cls-setup)
-   [Breaking out of DI](#breaking-out-of-di)
-   [Security considerations](#security-considerations)
-   [Compatibility considerations](#compatibility-considerations)
    -   [REST](#rest)
    -   [GraphQL](#graphql)
    -   [Others](#others)
-   [Namespaces](#namespaces-experimental) (experimental)

# Install

```bash
npm install nestjs-cls
# or
yarn add nestjs-cls
```

> Note: This module requires additional peer deps, like the nestjs core and common libraries, but it is assumed those are already installed.

# Quick Start

Below is an example of storing the client's IP address in an interceptor and retrieving it in a service without explicitly passing it along.

> Note: This example assumes you are using HTTP and therefore can use middleware. For usage with non-HTTP transports, keep reading.

```ts
// app.module.ts
@Module({
    imports: [
        // Register the ClsModule and automatically mount the ClsMiddleware
        ClsModule.register({
            global: true,
            middleware: { mount: true }
        }),
    ],
    providers: [AppService],
    controllers: [AppController],
})
export class TestHttpApp {}


/* user-ip.interceptor.ts */
@Injectable()
export class UserIpInterceptor implements NestInterceptor {
    constructor(
        // Inject the ClsService into the interceptor to get
        // access to the current shared cls context.
        private readonly cls: ClsService
    )

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // Extract the client's ip address from the request...
        const request = context.switchToHttp().getRequest();
        cosnt userIp = req.connection.remoteAddress;
        // ...and store it to the cls context.
        this.cls.set('ip', userIp);
        return next.handle();
    }
}


/* app.controller.ts */

// By mounting the interceptor on the controller, it gets access
// to the same shared cls context that the ClsMiddleware set up.
@UseInterceptors(UserIpInterceptor)
@Injectable()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('/hello')
    hello() {
        return this.appService.sayHello();
    }
}


/* app.service.ts */
@Injectable()
export class AppService {
    constructor(
        // Inject ClsService to be able to retireve data from the cls context.
        private readonly cls: ClsService
    ) {}

    sayHello() {
        // Here we can extract the value of 'ip' that was
        // put into the cls context in the interceptor.
        return 'Hello ' + this.cls.get<string>('ip') + '!';
    }
}
```

# How it works

Continuation-local storage provides a common space for storing and retrieving data throughout the life of a function/callback call chain. In NestJS, this allows for sharing request data across the lifetime of a single request - without the need for request-scoped providers. It also makes it easy to track and log request ids throughout the whole application.

To make CLS work, it is required to set up a cls context first. This is done by calling `cls.run()` (or `cls.enter()`) somewhere in the app. Once that is set up, anything that is called within the same callback chain has access to the same storage with `cls.set()` and `cls.get()`.

## HTTP

Since in NestJS, HTTP **middleware** is the first thing to run when a request arrives, it is an ideal place to initialise the cls context. This package provides `ClsMidmidleware` that can be mounted to all (or selected) routes inside which the context is set up before the `next()`

All you have to do is mount it to routes in which you want to use CLS, or pass `middleware: { mount: true }` to the `ClsModule.register` options which automatically mounts it to all routes.

Once that is set up, the `ClsService` will have access to a common storage in all _Guards, Interceptors, Pipes, Controllers, Services and Exception Filters_ that are called within that route.

## Manually mounting the middleware

Sometimes, you might want to only use CLS on certain routes. In that case, you can bind the ClsMiddleware manually in the module:

```ts
export class TestHttpApp implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        apply(ClsMiddleware).forRoutes(AppController);
    }
}
```

Sometimes, however, that won't be enough, because the middleware could be mounted too late and you won't be able to use it in other middlewares (**as is the case of GQL resolvers**). In that case, you can mount it directly in the bootstrap method:

```ts
function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // create and mount the middleware manually here
    app.use(
        new ClsMiddleware({
            /* useEnterWith: true*/
        }).use,
    );
    await app.listen(3000);
}
```

> Please note: If you bind the middleware using `app.use()`, it will not respect middleware settings passed to `ClsModule.forRoot()`, so you will have to provide them yourself in the constructor.

## Non-HTTP

For all other transports that don't use middleware, this package provides a `ClsGuard` to set up the CLS context. To use it, pass its configuration to the `guard` property to the `ClsModule.register` options:

```ts
ClsModule.register({
    guard: { generateId: true, mount: true }
}),
```

> Please note: using the ClsGuard comes with some [security considerations](#security-considerations)!

# API

The injectable `ClsService` provides the following API to manipulate the cls context:

-   **_`set`_**`<T>(key: string, value: T): T`  
    Set a value on the CLS context.
-   **_`get`_**`<T>(key: string): T`  
    Retrieve a value from the CLS context by key.
-   **_`getId`_**`(): string;`  
    Retrieve the request ID (a shorthand for `cls.get(CLS_ID)`)
-   **_`getStore`_**`(): any`  
    Retrieve the object containing all properties of the current CLS context.
-   **_`enter`_**`(): void;`  
    Run any following code in a shared CLS context.
-   **_`run`_**`(callback: () => T): T;`  
    Run the callback in a shared CLS context.
-   **_`isActive`_**`(): boolean`  
    Whether the current code runs within an active CLS context.

# Options

The `ClsModule.register()` method takes the following options:

-   **`ClsModuleOptions`**

    -   **_`namespaceName`_: `string`**  
        The name of the cls namespace. This is the namespace that will be used by the ClsService and ClsMiddleware (most of the time you will not need to touch this setting)
    -   **_`global:`_ `boolean`** (default _`false`_)  
        Whether to make the module global, so you do to import `ClsModule` in other modules.
    -   **_`middleware:`_ `ClsMiddlewareOptions`**  
        An object with additional middleware options, see below
    -   **_`guard:`_ `ClsGuardOptions`**  
        An object with additional guard options, see below

The `ClsMiddleware` takes the following options (either set up in `ClsModuleOptions` or directly when instantiating it manually):

-   **`ClsMiddlewareOptions`**

    -   **_`mount`_: `boolean`** (default _`false`_)  
        Whether to automatically mount the middleware to every route (not applicable when instantiating manually)
    -   **_`generateId`_: `bolean`** (default _`false`_)  
        Whether to automatically generate request IDs.
    -   **_`idGenerator`_: `(req: Request) => string | Promise<string>`**  
        An optional function for generating the request ID. It takes the `Request` object as an argument and (synchronously or asynchronously) returns a string. The default implementation uses `Math.random()` to generate a string of 8 characters.
    -   **_`saveReq`_: `boolean`** (default _`true`_)  
         Whether to store the _Request_ object to the context. It will be available under the `CLS_REQ` key.
    -   **_`saveRes`_: `boolean`** (default _`false`_)  
        Whether to store the _Response_ object to the context. It will be available under the `CLS_RES` key
    -   **_`useEnterWith`_: `boolean`** (default _`false`_)  
        Set to `true` to set up the context using a call to [`AsyncLocalStorage#enterWith`](https://nodejs.org/api/async_context.html#async_context_asynclocalstorage_enterwith_store) instead of wrapping the `next()` call with the safer [`AsyncLocalStorage#run`](https://nodejs.org/api/async_context.html#async_context_asynclocalstorage_run_store_callback_args). Most of the time this should not be necessary, but [some frameworks](#graphql) are known to lose the context with `run`.

-   **`ClsGuardOptions`**

    -   **_`mount`_: `boolean`** (default _`false`_)  
        Whether to automatically mount the guard as APP_GUARD
    -   **_`generateId`_: `bolean`** (default _`false`_)  
        Whether to automatically generate request IDs.
    -   **_`idGenerator`_: `(context: ExecutionContext) => string | Promise<string>`**  
        An optional function for generating the request ID. It takes the `ExecutionContext` object as an argument and (synchronously or asynchronously) returns a string. The default implementation uses `Math.random()` to generate a string of 8 characters.

# Request ID

Because of a shared storage, CLS is an ideal tool for tracking request (correlation) ids for the purpose of logging. This package provides an option to automatically generate request ids in the middleware/guard, if you pass `{ generateId: true }` to the middleware/guard options. By default, the generated ID is a string based on `Math.random()`, but you can provide a custom function in the `idGenerator` option.

This function receives the `Request` (or `ExecutionContext` in case a `ClsGuard` is used) as the first parameter, which can be used in the generation process and should return a string id that will be stored in the CLS for later use.

Below is an example of retrieving the request ID from the request header with a fallback to an autogenerated one.

```ts
ClsModule.register({
    middleware: {
        mount: true,
        generateId: true
        idGenerator: (req: Request) =>
            req.headers['X-Correlation-Id'] ?? uuid();
    }
})
```

The ID is stored under the `CLS_ID` constant in the context. `ClsService` provides a shorthand method `getId` to quickly retrieve it anywhere. It can be for example used in a custom logger:

```ts
// my.logger.ts
@Injectable()
class MyLogger {
    constructor(private readonly cls: ClsService) {}

    log(message: string) {
        console.log(`<${this.cls.getId()}> ${message}`);
    }

    // [...]
}

// my.service.ts
@Injectable()
class MyService {
    constructor(private readonly logger: MyLogger);

    hello() {
        this.logger.log('Hello');
        // -> logs for ex.: "<44c2d8ff-49a6-4244-869f-75a2df11517a> Hello"
    }
}
```

# Additional CLS Setup

The CLS middleware/guard provide some default functionality, but sometimes you might want to store more thing in the context by default. This can be of course done in a custom enhancer bound after, but for this scenario the `ClsMiddleware/ClsGuard` options expose the `setup` function, which will be executed in the middleware/guard after the CLS context is set up.

The function receives the `ClsService` and the `Request` (or `ExecutionContext`) object, and can be asynchronous.

```ts
ClsModule.register({
    middleware: {
        mount: true,
        setup: (cls, req) => {
            // put some additional default info in the CLS
            cls.set('AUTH', { authenticated: false });
        },
    },
});
```

# Breaking out of DI

While this package aims to be compatible with NestJS's DI, it is also possible to access the CLS context outside of it. For that, it provides the static `ClsServiceManager` class that exposes the `getClsService()` method.

```ts
function helper() {
    const cls = ClsServiceManager.getClsService();
    // you now have access to the shared storage
    console.log(cls.getId());
}
```

> Please note: Only use this feature where absolutely necessary. Using this technique instead of dependency injection will make it difficult to mock the ClsService and your code will become harder to test.

# Security considerations

It is often discussed whether [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html) is safe to use for _concurrent requests_ (because of a possible context leak) and whether the context could be _lost_ throughout the life duration of a request.

The `ClsMiddleware` by default uses the safe `run()` method, so it should be possible to leak context, however, that only works for REST `Controllers`.

GraphQL `Resolvers`, cause the context to be lost and therefore require using the less safe `enterWith()` method. The same applies to using `ClsGuard` to set up the context, since there's no callback to wrap with the `run()` call (so the context would be not available outside of the guard otherwise).

**This has one consequence that should be taken into account:**

> When the `enterWith` method is used, any consequent requests _get access_ to the context of the previous one _until the request hits the `enterWith` call_.

That means, when using `ClsMiddleware` with the `useEnterWith` option, or `ClsGuard` to set up context, be sure to mount them as early in the request lifetime as possible and do not use any other enhancers that rely on `ClsService` before them. For `ClsGuard`, that means you should probably manually mount it in `AppModule` if you require any other guard to run _after_ it.

# Compatibility considerations

## REST

This package is 100% compatible with Nest-supported REST controllers when you use the `ClsMiddleware` with the `mount` option.

-   ✔ Express
-   ✔ Fastify

## GraphQL

For GraphQL, the `ClsMiddleware` needs to be [mounted manually](#manually-mounting-the-middleware) with `app.use(...)` in order to correctly set up the context for resolvers. Additionally, you have to pass `useEnterWith: true` to the `ClsMiddleware` options, because the context gets lost otherwise.

-   ⚠ Apollo (Express)
    -   There's an [issue with CLS and Apollo](https://github.com/apollographql/apollo-server/issues/2042) talking about the context loss.
-   ⚠ Mercurius (Fastify)
    -   The [same problem](https://github.com/Papooch/nestjs-cls/issues/1) applies here.

## Others

Use the `ClsGuard` to set up context with any other platform. This is still **experimental**, as there are no test and I can't guarantee it will work with your platform of choice.

# Namespaces (experimental)

> Warning: Namespace support is currently experimental and has no tests. While the API is mostly stable now, it can still change any time.

The default CLS namespace that the `ClsService` provides should be enough for most application, but should you need it, this package provides a way to use multiple CLS namespaces in order to be fully compatible with `cls-hooked`.

> Note: Since cls-hooked was ditched in version 1.2, it is no longer necessary to strive for compatibility with it. Still, the namespace support was there and there's no reason to remove it.

To use custom namespace provider, use `ClsModule.forFeature('my-namespace')`.

```ts
@Module({
    imports: [ClsModule.forFeature('hello-namespace')],
    providers: [HelloService],
    controllers: [HelloController],
})
export class HelloModule {}
```

This creates a namespaces `ClsService` provider that you can inject using `@InjectCls`

```ts
@Injectable()
class HelloService {
    constructor(
        @InjectCls('hello-namespace')
        private readonly myCls: ClsService,
    ) {}

    sayHello() {
        return this.myCls.get('hi');
    }
}
```

> Note: `@InjectCls('x')` is equivalent to `@Inject(getNamespaceToken('x'))`. If you don't pass an argument to `@InjectCls()`, the default ClsService will be injected and is equivalent to omitting the decorator altogether.

```ts
@Injectable()
export class HelloController {
    constructor(
        @InjectCls('hello-namespace')
        private readonly myCls: ClsService,
        private readonly helloService: HelloService,
    );

    @Get('/hello')
    hello2() {
        // seting up cls context manually
        return this.myCls.run(() => {
            this.myCls.set('hi', 'Hello');
            return this.helloService.sayHello();
        });
    }
}
```
