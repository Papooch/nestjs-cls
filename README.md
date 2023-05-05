# NestJS CLS (Async Context)

A continuation-local\* storage module compatible with [NestJS](https://nestjs.com/)' dependency injection based on [AsyncLocalStorage](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage).

> **New**: Version `3.0` introduces [_Proxy Providers_](#proxy-providers) as an alternative to the imperative API. (Minor breaking changes were introduced, see [Migration guide](#migration-guide)).

> Version `2.0` brings advanced [type safety and type inference](#type-safety-and-type-inference). However, it requires features from `typescript >= 4.4` - Namely allowing `symbol` members in interfaces. If you can't upgrade but still want to use this library, install version `1.6.2`, which lacks the typing features.

_Continuation-local storage allows to store state and propagate it throughout callbacks and promise chains. It allows storing data throughout the lifetime of a web request or any other asynchronous duration. It is similar to thread-local storage in other languages._

Some common use cases that this library enables include:

-   Tracking the Request ID and other metadata for logging purposes
-   Keeping track of the user throughout the whole request
-   Making the dynamic Tenant database connection available everywhere in multi-tenant apps
-   Propagating the authentication level or role to restrict access to resources
-   Seamlessly propagating the `transaction` object of your favourite ORM across services without breaking encapsulation and isolation by explicitly passing it around.
-   Using "request" context in cases where actual REQUEST-scoped providers are not supported (passport strategies, cron controllers, websocket gateways, ...)

Most of these are to some extent solvable using _REQUEST-scoped_ providers or passing the context as a parameter, but these solutions are often clunky and come with a whole lot of other issues.

You might also be interested in [The Author's Take](#the-authors-take) on the topic.

> (\*) The name comes from the original implementation based on `cls-hooked`, which was since replaced by the native `AsyncLocalStorage`.

# Outline

-   [Install](#install)
-   [Quick Start](#quick-start)
-   [How it works](#how-it-works)
-   [Setting up the CLS context](#setting-up-the-cls-context)
    -   [Using a Middleware](#using-a-middleware-http-only)
    -   [Using a Guard](#using-a-guard)
    -   [Using an Interceptor](#using-an-interceptor)
    -   [Using an Decorator](#using-a-decorator)
-   [Features and use cases](#features-and-use-cases)
    -   [Request ID](#request-id)
    -   [Additional CLS Setup](#additional-cls-setup)
    -   [Breaking out of DI](#breaking-out-of-di)
    -   [Usage outside of web request](#usage-outside-of-web-request)
    -   [Type safety and type inference](#type-safety-and-type-inference)
    -   [Proxy Providers](#proxy-providers)
        -   [Classes](#class-proxy-providers)
        -   [Factories](#factory-proxy-providers)
-   [API](#api)
    -   [Service Interface](#service-interface)
    -   [Module Options](#module-options)
-   [Security considerations](#security-considerations)
-   [Compatibility considerations](#compatibility-considerations)
    -   [REST](#rest)
    -   [GraphQL](#graphql)
    -   [Others](#others)
-   [The Author's Take](#the-authors-take)
-   [Contributing](#contributing)
-   [Migration guide](#migration-guide)

# Install

```bash
npm install nestjs-cls
# or
yarn add nestjs-cls
```

> **Note**: This module requires additional peer deps, like the nestjs core and common libraries, but it is assumed those are already installed.

# Quick Start

Below is an example of storing the client's IP address in an interceptor and retrieving it in a service without explicitly passing it along.

> **Note**: This example assumes you are using HTTP and therefore can use middleware. For usage with non-HTTP transports, keep reading.

```ts
// app.module.ts
@Module({
    imports: [
        // Register the ClsModule and automatically mount the ClsMiddleware
        ClsModule.forRoot({
            global: true,
            middleware: { mount: true },
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
        private readonly cls: ClsService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // Extract the client's ip address from the request...
        const request = context.switchToHttp().getRequest();
        const userIp = request.connection.remoteAddress;
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
        // Inject ClsService to be able to retrieve data from the cls context.
        private readonly cls: ClsService,
    ) {}

    sayHello() {
        // Here we can extract the value of 'ip' that was
        // put into the cls context in the interceptor.
        return 'Hello ' + this.cls.get('ip') + '!';
    }
}
```

# How it works

Continuation-local storage provides a common space for storing and retrieving data throughout the life of a function/callback call chain. In NestJS, this allows for sharing request data across the lifetime of a single request - without the need for request-scoped providers. It also makes it easy to track and log request ids throughout the whole application.

To make CLS work, it is required to set up the CLS context first. This is done by calling `cls.run()` (or `cls.enter()`, see [Security considerations](#security-considerations) for more info) somewhere in the app. Once that is set up, anything that is called within the same callback chain has access to the same storage with `cls.set()` and `cls.get()`.

# Setting up the CLS context

This package provides **three** methods of setting up the CLS context for incoming requests. This is mainly due to the fact that different underlying platforms are compatible with some of these methods - see [Compatibility considerations](#compatibility-considerations).

For HTTP transports, the context can be preferably set up in a `ClsMiddleware`. For all other platforms, or cases where the `ClsMiddleware` is not applicable, this package also provides a `ClsGuard` and `ClsInterceptor`. While both of these also work with HTTP, they come with some caveats, see below.

---

## Using a Middleware (HTTP Only)

Since in NestJS, HTTP **middleware** is the first thing to run when a request arrives, it is an ideal place to initialise the CLS context. This package provides `ClsMiddleware` that can be mounted to all (or selected) routes inside which the context is set up before the `next()` call.

All you have to do is mount it to routes in which you want to use CLS, or pass `middleware: { mount: true }` to the `ClsModule.forRoot()` options which automatically mounts it to all routes[*](#manually-mounting-the-middleware).

Once that is set up, the `ClsService` will have access to a common storage in all _Guards, Interceptors, Pipes, Controllers, Services and Exception Filters_ that are called within that route.

### Manually mounting the middleware

Sometimes, you might want to only use CLS on certain routes, or you need to have more control over the order of middleware regisration in combination with other middlewares.

In that case, you can bind the ClsMiddleware manually in the module:

```ts
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ClsMiddleware).forRoutes(AppController);
    }
}
```

Sometimes, however, that won't be enough, because the middleware could be mounted too late and you won't be able to use it in other middlewares that need to run prior to that - for example, the API versioning feature of NestJS apparently interferes with the order, see issue [#67](https://github.com/Papooch/nestjs-cls/issues/67).

In that case, you can mount it directly in the bootstrap method:

```ts
function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // create and mount the middleware manually here
    app.use(
        new ClsMiddleware({
            /* ...settings */
        }).use,
    );
    await app.listen(3000);
}
```

> **Please note**: If you bind the middleware using `app.use()`, it will not respect middleware settings passed to `ClsModule.forRoot()`, so you will have to provide them yourself in the constructor.

---

## Using a Guard

The `ClsGuard` can be also used set up the CLS context. While it is not a "guard" per-se, it's the second best place to set up the CLS context, since after a middleware, it is the first piece of code that the request hits.

To use it, pass its configuration to the `guard` property to the `ClsModule.forRoot()` options:

```ts
ClsModule.forRoot({
    guard: { generateId: true, mount: true }
}),
```

If you need any other guards to use the `ClsService`, it's preferable to mount `ClsGuard` manually as the first guard in the root module:

```ts
@Module({
    //...
    providers: [
        {
            provide: APP_GUARD,
            useClass: ClsGuard,
        },
    ],
})
export class AppModule {}
```

or mount it directly on the Controller/Resolver with

```ts
@UseGuards(ClsGuard);
```

> **Please note**: since the `ClsGuard` uses the `AsyncLocalStorage#enterWith` method, using the `ClsGuard` comes with some [security considerations](#security-considerations)!

---

## Using an Interceptor

Another place to initiate the CLS context is an `ClsInterceptor`, which, unlike the `ClsGuard` uses `AsyncLocalStorage#run` method to wrap the following code, which is considered safer than `enterWith`.

To use it, pass its configuration to the `interceptor` property to the `ClsModule.forRoot()` options:

```ts
ClsModule.forRoot({
    interceptor: { generateId: true, mount: true }
}),
```

Or mount it manually as `APP_INTERCEPTOR`, or directly on the Controller/Resolver with:

```ts
@UseInterceptors(ClsInterceptor);
```

> **Please note**: Since Nest's _Interceptors_ run after _Guards_, that means using this method makes CLS **unavailable in Guards** (and in case of REST Controllers, also in **Exception Filters**).

## Using a Decorator

The `@UseCls()` decorator can be used at a method level to declaratively wrap the method with a `cls.run()` call. This method should only be used [outside of the context of a web request](#usage-outside-of-web-request).

> Note: Please keep in mind, that since the CLS context initialization _can_ be async, the `@UseCls()` decorator can _only_ be used on _async_ function (or those that return a `Promise`).

# Features and use cases

In addition to the basic functionality described in the [Quick start](#quick-start) chapter, this module provides several other features.

## Request ID

Because of a shared storage, CLS is an ideal tool for tracking request (correlation) IDs for the purpose of logging. This package provides an option to automatically generate request IDs in the middleware/guard/interceptor, if you pass `{ generateId: true }` to its options. By default, the generated ID is a string based on `Math.random()`, but you can provide a custom function in the `idGenerator` option.

This function receives the `Request` (or `ExecutionContext` in case a `ClsGuard` is used) as the first parameter, which can be used in the generation process and should return (or resolve with) a string ID that will be stored in the CLS for later use.

Below is an example of retrieving the request ID from the request header with a fallback to an autogenerated one.

```ts
ClsModule.forRoot({
    middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) =>
            req.headers['X-Request-Id'] ?? uuid();
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

---

## Additional CLS Setup

The CLS middleware/guard/interceptor provide some default functionality, but sometimes you might want to store more things about the request in the context. This can be of course done in a custom enhancer bound after, but for this scenario the options expose the `setup` function, which will be executed in the enhancer right after the CLS context is set up.

The function receives the `ClsService` instance, the `Request` and `Response` objects (or the `ExecutionContext` object) , and can be asynchronous.

```ts
ClsModule.forRoot({
    middleware: {
        mount: true,
        setup: (cls, req: Request, res: Response) => {
            // put some additional default info in the CLS
            cls.set('TENANT_ID', req.params('tenant_id'));
            cls.set('AUTH', { authenticated: false });
        },
    },
});
```

---

## Usage outside of web request

Sometimes, a part of the app that relies on the CLS storage might need to be called outside of the context of a web request - for example, in a Cron job, while consuming a Queue or during the application bootstrap. In such cases, there are no enhancers that can be bound to the handler to set up the context.

Therefore, you as the the developer are responsible for wrapping the execution with `ClsService#run`, or using the `@UseCls` decorator. In any case, if any following code depends on some context variables, these need to be set up manually.

```ts
@Injectable()
export class CronController {
    constructor(
        private readonly someService: SomeService,
        private readonly cls: ClsService,
    );

    @Cron('45 * * * * *')
    async handleCronExample1() {
        // either explicitly wrap the function body with
        // a call to `ClsService#run` ...
        await this.cls.run(async () => {
            this.cls.set('mode', 'cron');
            await this.someService.doTheThing();
        });
    }

    @Cron('90 * * * * *')
    // ... or use the convenience decorator which
    // does the wrapping for you seamlessly.
    @UseCls({
        setup: (cls) => {
            cls.set('mode', 'cron');
        },
    })
    async handleCronExample2() {
        await this.someService.doTheThing();
    }
}
```

---

## Breaking out of DI

While this package aims to be compatible with NestJS's DI, it is also possible to access the CLS context outside of it. For that, it provides the static `ClsServiceManager` class that exposes the `getClsService()` method.

```ts
function helper() {
    const cls = ClsServiceManager.getClsService();
    // you now have access to the shared storage
    console.log(cls.getId());
}
```

> **Please note**: Only use this feature where absolutely necessary. Using this technique instead of dependency injection will make it difficult to mock the ClsService and your code will become harder to test.

---

## Type safety and type inference

> Since `v2.0`

By default the CLS context is untyped and allows setting and retrieving any `string` or `symbol` key from the context. Some safety can be enforced by using `CONSTANTS` instead of magic strings, but that might not be enough.

### Type-safe ClsService

It is possible to specify a custom interface for the `ClsService` and get proper typing and automatic type inference when retrieving or setting values. This works even for _nested objects_ using a dot notation.

To create a typed CLS Store, start by creating an interface that extends `ClsStore`.

```ts
export interface MyClsStore extends ClsStore {
    tenantId: string;
    user: {
        id: number;
        authorized: boolean;
    };
}
```

Then you can inject the `ClsService` with a type parameter `ClsService<MyClsStore>` to make use of the safe typing.

```ts
export class MyService {
    constructor(private readonly cls: ClsService<MyClsStore>) {}

    doTheThing() {
        // a boolean type will be enforced here
        this.cls.set('user.authorized', true);

        // tenantId will be inferred as a string
        const tenantId = this.cls.get('tenantId');

        // userId will be inferred as a number
        const userId = this.cls.get('user.id');

        // user will be inferred as { id: number, authorized: boolean }
        const user = this.cls.get('user');

        // you'll even get intellisense for the keys, because the type
        // will be inferred as:
        // symbol | 'tenantId˙ | 'user' | 'user.id' | 'user.authorized'

        // alternatively, since the `get` method returns the whole store
        // when called without arguments, you can use object destructuring
        const { tenantId, user } = this.cls.get();

        // accessing a nonexistent property will result in a type error
        const notExist = this.cls.get('user.name');
    }
}
```

Alternatively, if you feel like using `ClsService<MyClsStore>` everywhere is tedious, you can instead globally [augment the `ClsStore interface`](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) and have strict typing of `ClsService` anywhere without the type parameter:

```ts
declare module 'nestjs-cls' {
    interface ClsStore {
        tenantId: string;
        user: {
            id: number;
            authorized: boolean;
        };
    }
}
```

For even more transparent approach without augmenting the declaration, you can create a typed `ClsService` by extending it and creating a custom provider out of it:

```ts
export class MyClsService extends ClsService<MyClsStore>

@Module({
    imports: [ClsModule.forFeature()]
    providers: [{
        provide: MyClsService,
        useExisting: ClsService
    }],
    exports: [MyClsService]
})
class MyClsModule
```

### Terminal Type

It can happen, that the object you want to store in the context is too complex, or contains cyclic references. In that case, typescript might complain that _type instantiation is too deep, possibly infinite_. That is due to the fact that it tries to generate all possible paths inside the ClsStore. If that's the case, you can use the `Terminal` type to stop generating the paths for a certain subtree:

```ts
interface ClsStore {
    tenantId: string;
    user: Terminal<{
        id: number;
        authorized: boolean;
    }>;
}
```

This will only generate the paths `tenantId | user` and won't allow directly accessing nested keys (like `cls.get('user.id')`, but you'll still get fully typing for things like `const { id } = cls.get('user')`). See issue [#22](https://github.com/Papooch/nestjs-cls/issues/22) for more details.

---

## Proxy Providers

> Since `v3.0`

This feature was inspired by how REQUEST-scoped providers (_"beans"_) work in the Spring framework for Java/Kotlin.

Using this technique, NestJS does not need to re-create a whole DI-subtree on each request (which has [certain implications which disallows the use of REQUEST-scoped providers in certain situations](https://docs.nestjs.com/fundamentals/injection-scopes#scope-hierarchy)), but it rather injects a _SINGLETON_ [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) instance, which delegates access and calls to the actual instance, which is created for each request when the CLS context is set up.

There are two kinds of Proxy providers - _Class_ and _Factory_.

### Class Proxy Providers

These providers look like your regular class providers, with the exception that is the `@InjectableProxy()` decorator to make them easily distinguishable.

```ts
@InjectableProxy()
export class User {
    id: number;
    role: string;
}
```

To register the proxy provider, use the `ClsModule.forFeature()` registration

```ts
ClsModule.forFeature(User);
```

It can be then injected using the class name. However, what will be actually injected _is not_ the instance of the class, but rather the Proxy which redirects all access to an unique instance in the CLS context.

```ts
@Injectable()
export class UserInterceptor implements NestInterceptor {
    // we can inject the proxy here
    constructor(private readonly user: User) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        // and assign or change values as it was a normal object
        this.user.id = request.user.id;
        this.user.role = 'admin';

        return next.handle();
    }
}
```

It is also possible to inject other providers into the Proxy Provider.

For the convenience, the `CLS_REQ` and `CLS_RES` were also made into Proxy Providers and are exported from the `ClsModule`.

```ts
@InjectableProxy()
export class AutoBootstrappingUser {
    id: number;
    role: string;

    constructor(@Inject(CLS_REQ) request: Request) {
        this.id = request.user.id;
        this.role = 'admin';
    }
}
```

If you need to inject a provider from an external module, use the `ClsService.forFeatureAsync()` registration to import it first.

```ts
ClsModule.forFeatureAsync({
    // say the DogsModule provides the DogsService
    import: [DogsModule],
    // now you can inject DogsService in the DogContext Proxy Provider
    useClass: DogContext,
});
```

### Factory Proxy Providers

Like your normal factory providers, Proxy factory providers look familiar.

Here's an example of a hypothetical factory provider that dynamically resolves to a specific tenant database connection:

```ts
ClsModule.forFeature({
    provide: TENANT_CONNECTION,
    import: [DatabaseConnectionModule],
    inject: [CLS_REQ, DatabaseConnectionService],
    useFactory: async (req: Request, dbService: DatabaseConnectionService) => {
        const tenantId = req.params['tenantId'];
        const connection = await dbService.getTenantConnection(tenantId);
        return connection;
    },
});
```

Again, the factory will be called on each request and the result will be stored in the CLS context. The `TENANT_CONNECTION` provider, however, will still be a singleton and will not affect the scope of whatever it is injected into.

In the service, it can be injected using the `provide` token as usual:

```ts
@Injectable()
class DogsService {
    constructor(
        @Inject(TENANT_CONNECTION)
        private readonly connection: TenantConnection,
    ) {}

    getAll() {
        //
        return this.connection.dogs.getAll();
    }
}
```

> **Please note**: Proxy Factory providers _cannot_ return a _primitive value_. This is because the provider itself is the Proxy and it only delegates access once a property or a method is called on it (or if it itself is called in case the factory provides a function).

### Delayed resolution of Proxy Providers

By default, proxy providers are resolved as soon as the `setup` function in an enhancer (middleware/guard/interceptor) finishes. For some use cases, it might be required that the resolution is delayed until some later point in the request lifecycle once more information is present in the CLS .

To achieve that, set `resolveProxyProviders` to `false` in the enhancer options and call `ClsService#resolveProxyProviders()` manually at any time.

This is also necessary if you want to access Proxy Providers [outside the context of web request](#usage-outside-of-web-request) once you set up the context with `cls.run()`, to actually _instantiate_ the Proxy Providers and store them in the CLS context. Otherwise all access to an injected Proxy Provider will return `undefined`.

# API

## Service interface

The injectable `ClsService` provides the following API to manipulate the cls context:

-   **_`set`_**`(key: string, value: any): void`  
    Set a value on the CLS context.

-   **_`get`_**`(key?: string): any`  
    Retrieve a value from the CLS context by key. Get the whole store if key is omitted.

-   **_`has`_**`(key: string): boolean`  
    Check if a key is in the CLS context.

-   **_`getId`_**`(): string;`  
    Retrieve the request ID (a shorthand for `cls.get(CLS_ID)`)

-   **_`enter`_**`(): void;`  
    Run any following code in a shared CLS context.

-   **_`enterWith`_**`(store: any): void;`  
    Run any following code in a shared CLS context (while supplying the default contents).

-   **_`run`_**`(callback: () => T): T;`  
    Run the callback in a shared CLS context.

-   **_`runWith`_**`(store: any, callback: () => T): T;`  
    Run the callback in a shared CLS context (while supplying the default contents).

-   **_`isActive`_**`(): boolean`  
    Whether the current code runs within an active CLS context.

-   **_`resolveProxyProviders`_**`(): Promise<boolean>`  
     Manually trigger resolution of Proxy Providers

---

## Module Options

### Root

The `ClsModule.forRoot()` method takes the following **`ClsModuleOptions`**:

-   **_`middleware?:`_ `ClsMiddlewareOptions`**  
    An object with additional options for the `ClsMiddleware`, see [below](#enhancer-options).

-   **_`guard?:`_ `ClsGuardOptions`**  
    An object with additional options for the `ClsGuard`, see [below](#enhancer-options).

-   **_`interceptor?:`_ `ClsInterceptorOptions`**  
    An object with additional options for the `ClsInterceptor`, see [below](#enhancer-options).

-   **_`global?:`_ `boolean`** (default _`false`_)  
    Whether to make the module global, so you do not have to import `ClsModule.forFeature()` in other modules.

-   **_`proxyProviders?:`_ `Type[]`**  
    Array of [Proxy Providers](#proxy-providers) that should be registered in the root module. Currently only accepts sync class Proxy providers, use `ClsModule.forFeatureAsync()` for more complex use-cases.

> **Please note**: the `middleware`, `guard` and `interceptor` options should be _mutually exclusive_ - do not use more than one of them, otherwise the context will be overwritten by the one that runs after.

`ClsModule.forRootAsync()` is also available. You can supply the usual `imports`, `inject` and `useFactory` parameters.

### Feature

The `ClsModule.forFeature()` method can be used to register a [Proxy Providers](#proxy-providers). The Sync method only accepts Class Proxy providers.

The `ClsModule.forFeatureAsync()` method accepts either `ClsModuleProxyClassProviderOptions` or `ClsModuleProxyFactoryProviderOptions` that both accept these options:

-   **_`provide?:`_ `any`**  
    Custom injection token to use for the provider. In case of a class provider, this parameter is optional, as the class reference passed to `useClass` will be used by default.

-   **_`imports?`_ `any[]`**  
    Optional list of imported modules that export the providers which are required for the provider.

-   **_`extraProviders?:`_ `Provider[]`**
    Optional list of additional providers that should be available to the Proxy. Useful for passing configuration from a parent dynamic module.

The `ClsModuleProxyClassProviderOptions` interface further accepts:

-   **_`useClass:`_ `Type`**  
    The target class that will be used by this Proxy Provider. Make sure it is decorated with `@InjectableProxy`.

The `ClsModuleProxyFactoryProviderOptions` interface further accepts:

-   **_`inject:`_ `any[]`**  
    An array of injection tokens for providers used in the `useFactory`.

-   **_`useFactory:`_ `(...args: any[]) => any`**  
    Factory function that accepts an array of providers in the order of the according tokens in the `inject` array. Returns (or resolves with) an object (or a function) that will be used by this Proxy Provider.

### Enhancer options

All of the **`Cls{Middleware,Guard,Interceptor}Options`** take the following parameters (either in `ClsModuleOptions` or directly when instantiating them manually):

-   **_`mount?:`_ `boolean`** (default _`false`_)  
    Whether to automatically mount the middleware/guard/interceptor to every route (not applicable when instantiating them manually)

-   **_`generateId?:`_ `boolean`** (default _`false`_)  
    Whether to automatically generate a request ID. It will be available under the `CLS_ID` key.

-   **_`idGenerator?:`_ `(req: Request) => string | Promise<string>`**  
    **_`idGenerator?:`_ `(ctx: ExecutionContext) => string | Promise<string>`**  
    An optional function for generating the request ID. It takes the `Request` object (or the `ExecutionContext` in case of a Guard or Interceptor) as an argument and (synchronously or asynchronously) returns a string. The default implementation uses `Math.random()` to generate a string of 8 characters.

-   **_`setup?:`_ `(cls: ClsService, req: Request) => void | Promise<void>;`**  
    **_`setup?:`_ `(cls: ClsService, ctx: ExecutionContext) => void | Promise<void>;`**  
    Function that executes after the CLS context had been initialised. It can be used to put additional variables in the CLS context.

-   **_`resolveProxyProviders?:`_ `boolean`** (default _`true`_)  
    Whether to automatically resolve Proxy Providers in the enhancer (if any are registered).

The `ClsMiddlewareOptions` additionally takes the following parameters:

-   **_`saveReq?:`_ `boolean`** (default _`true`_)  
     Whether to store the _Request_ object to the context. It will be available under the `CLS_REQ` key.

-   **_`saveRes?:`_ `boolean`** (default _`false`_)  
    Whether to store the _Response_ object to the context. It will be available under the `CLS_RES` key

-   **_`useEnterWith?:`_ `boolean`** (default _`false`_)  
    Set to `true` to set up the context using a call to [`AsyncLocalStorage#enterWith`](https://nodejs.org/api/async_context.html#async_context_asynclocalstorage_enterwith_store) instead of wrapping the `next()` call with the safer [`AsyncLocalStorage#run`](https://nodejs.org/api/async_context.html#async_context_asynclocalstorage_run_store_callback_args). Most of the time this should not be necessary, but [some frameworks](#graphql) are known to lose the context with `run`.

# Security considerations

It is often discussed whether [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html) is safe to use for _concurrent requests_ (because of a possible context leak) and whether the context could be _lost_ throughout the duration of a request.

The `ClsMiddleware` by default uses the safe `run()` method, so it should not leak context, however, that only works for REST `Controllers`.

GraphQL `Resolvers`, cause the context to be lost and therefore require using the less safe `enterWith()` method. The same applies to using `ClsGuard` to set up the context, since there's no callback to wrap with the `run()` call, the only way to set up context in a guard is to use `enterWith()` (the context would be not available outside of the guard otherwise).

**This has a consequence that should be taken into account:**

> When the `enterWith` method is used, any consequent requests _get access_ to the context of the previous one _until the request hits the `enterWith` call_.

That means, when using `ClsMiddleware` with the `useEnterWith` option, or `ClsGuard` to set up context, be sure to mount them as early in the request lifetime as possible and do not use any other enhancers that rely on `ClsService` before them. For `ClsGuard`, that means you should probably manually mount it in `AppModule` if you require any other guard to run _after_ it.

The `ClsInterceptor` only uses the safe `run()` method.

# Compatibility considerations

The table below outlines the compatibility with some platforms:

|                                                              |                           REST                           | GQL |         WS         | Microservices |
| :----------------------------------------------------------: | :------------------------------------------------------: | :-: | :----------------: | :-----------: |
|                      **ClsMiddleware**                       |                            ✔                             |  ✔  |         ✖          |       ✖       |
|             **ClsGuard** <br>(uses `enterWith`)              |                            ✔                             |  ✔  | ✔[\*](#websockets) |       ✔       |
| **ClsInterceptor** <br>(context inaccessible<br>in _Guards_) | ✔<br>context also inaccessible<br>in _Exception Filters_ |  ✔  | ✔[\*](#websockets) |       ✔       |

## REST

This package is 100% compatible with Nest-supported REST controllers and the preferred way is to use the `ClsMiddleware` with the `mount` option.

Tested with:

-   ✔ Express
-   ✔ Fastify

## GraphQL

### `@nestjs/graphql >= 10`,

Since v10, this package is 100% compatible with GraphQL resolvers and the preferred way is to use the `ClsMiddleware` with the `mount` option.

Using an interceptor or a guard may result in that enhancer triggering multiple times in case of nested resolvers, which may mess with ID generation.

### `@nestjs/graphql < 10`

For older versions of graphql, the `ClsMiddleware` needs to be [mounted manually](#manually-mounting-the-middleware) with `app.use(...)` in order to correctly set up the context for resolvers. Additionally, you have to pass `useEnterWith: true` to the `ClsMiddleware` options, because the context gets lost otherwise due to [an issue with CLS and Apollo](https://github.com/apollographql/apollo-server/issues/2042) (sadly, the same is true for [Mercurius](https://github.com/Papooch/nestjs-cls/issues/1)). This method is functionally identical to just using the `ClsGuard`.

Alternatively, you can use the `ClsInterceptor`, which uses the safer `AsyncLocalStorage#run` (thanks to [andreialecu](https://github.com/Papooch/nestjs-cls/issues/5)), but remember that using it makes CLS unavailable in _Guards_.

Tested with:

-   ✔ Apollo (Express)
-   ✔ Mercurius (Fastify)

## Others

Use the `ClsGuard` or `ClsInterceptor` to set up context with any other platform.There are no explicit test for other transports, so I can't guarantee it will work with your platform of choice, but there's nothing that would indicate otherwise.

> If you decide to try this package with a platform that is not listed here, **please let me know** so I can add the compatibility notice.

Below are listed platforms with which it is confirmed to work:

### Websockets

_Websocket Gateways_ don't respect globally bound enhancers, therefore it is required to bind the `ClsGuard` or `ClsInterceptor` manually on the `WebsocketGateway`. Special care is also needed for the `handleConnection` method (See [#8](https://github.com/Papooch/nestjs-cls/issues/8))

# The author's take:

_NestJS is an amazing framework, but in the plethora of awesome built-in features, I still missed one_.

_I created this library to solve a specific use case, which was limiting access to only those records which had the same TenantId as the request's user in a central manner. The repository code automatically added a `WHERE` clause to each query, which made sure that other developers couldn't accidentally mix tenant data (all tenants' data were held in the same database) without extra effort._

_`AsyncLocalStorage` is still fairly new and not many people know of its existence and benefits. Here's a nice [talk from NodeConf](https://youtu.be/R2RMGQhWyCk?t=9742) about the history. I've invested a great deal of my personal time in making the use of it as pleasant as possible._

_While the use of `async_hooks` is sometimes criticized for [making Node run slower](https://gist.github.com/Aschen/5cc1f3f3b58f1e284b670b83bb53da7d), in my experience, the introduced overhead is negligible compared to any IO operation (like a DB or external API call). If you want fast, use a compiled language._

_Also, if you use some tracing library (like `otel`), it most likely already uses `async_hooks` under the hood, so you might as well use it to your advantage._

# Contributing

Contributing to a community project is always welcome, please see the [Contributing guide](./CONTRIBUTING.md) :)

# Migration Guide

## `v2.x` ➡️ `v3.x`

-   The root registration method was _renamed_ from `register` (resp. `registerAsync`) to `forRoot` (resp. `forRootAsync`) to align with the convention.

    ```diff
    - ClsModule.register({
    + ClsModule.forRoot({
          middleware: { mount: true },
      }),
    ```

-   Namespace injection support was dropped entirely, if you still have use case for it, you can still create a namespaced `ClsService` and use a custom provider to inject it.

    ```ts
    // for example:

    class MyContextService extends ClsService<MyStore> {}
    const myContextService = new MyContextService(new AsyncLocalStorage());

    // [...]
    providers: [
        {
            provide: MyContextService,
            useValue: myContextService,
        },
    ];
    ```
