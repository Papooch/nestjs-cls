# NestJS CLS

A continuation-local storage module compatible with [NestJS](https://nestjs.com/)'s dependency injection.

> Note: This package uses [cls-hooked](https://www.npmjs.com/package/cls-hooked) as a peer dependency. For more information about how CLS works, visit their docs.

# Outline

-   [Install](#install)
-   [Quick Start](#quick-start)
-   [How it works](#how-it-works)
    -   [With HTTP](#with-http)
    -   [Without HTTP](#without-http)
-   [Options](#options)
-   [API](#api)
-   [Request ID](#request-id)
-   [Namespaces](#namespaces) (currently unsupported)

# Install

```bash
npm install nestjs-cls cls-hooked
# or
yarn add nestjs-cls cls-hooked
```

> Note: This module requires additional peer deps, like the nestjs core and common libraries, but it is assumed those are already installed.

# Quick Start

Below is an example of storing the client's IP address in an interceptor and retrieving it in a service without explicitly passing it along.

> Note: This example assumes you are using HTTP and therefore can use middleware. For usage with non-HTTP controllers, keep reading.

```ts
// app.module.ts
@Module({
    imports: [
        // Register the ClsModule...
        ClsModule.register({}),
    ],
    providers: [AppService],
    controllers: [AppController],
})
export class TestHttpApp implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // ...and apply the ClsMiddleware to set up shared context inside
        // all routes that should have access to it.
        // You can also pass `{ middleware: { mount: true } }` as a paramerer
        // to the ClsModule.register options to automatically mount the middleware
        // for all routes.
        apply(ClsMiddleware).forRoutes(AppController);
    }
}


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

To make CLS work, it is required to set up a cls context first. This is done by passing a function as a callback to `cls.run()` (see cls-hooked docs). Once that is set up, anything that is called from within that function has access to the same storage with `cls.set()` and `cls.get()`.

As for now, there are two ways of setting up the cls context depending on if you are using HTTP (express or fastify) or non-HTTP (RPC, websockets, ...) controllers. The latter comes with a drawback, more on that later.

## With HTTP

Since in NestJS, HTTP middleware is the first thing to run when a request arrives, it is an ideal place to initialise the cls context. This package provides `ClsMidmidleware` that can be mounted to all (or selected) routes inside which the `next()` call is wrapped with `cls.run()`.

All you have to do is mount it to routes in which you want to use CLS, or pass `middleware: { mount: true }` to the `ClsModule.register` options which automatically mounts it to all routes.

Once that is set up, the `ClsService` will have access to a common storage in all _Guards, Interceptors, Pipes, Controllers, Services and Exception Filters_ that are called within that route.

## Without HTTP

With non-http controllers, the first place in which it is possible to wrap a callback call is in an _Interceptor_ ([see request lifecycle](https://docs.nestjs.com/faq/request-lifecycle#summary)), therefore, this package provides `ClsInterceptor` which has the same function as `ClsMiddleware`. Pass `interceptor: { mount: true }` to `ClsModule.register` options to automatically mount it globally.

> The obvious disadvantage of the interoceptor method is that **you won't be able to access the CLS inside Guards**. (I'm still trying to figure out a way around it, but it may require some digging in Nest's internals) Other that that, this method is functionally equivalent and you can safely access the CLS in other parts of the app.

# API

The injectable `ClsService` provides the following API to manipulate the cls context:

```ts
interface ClsService {
    /**
     * set a value on the cls context
     */
    set<T>(key: string, value: T): T;

    /**
     * retrieve a value from the cls context
     */
    get<T>(key: string): T;

    /**
     * retrieve the request id
     * (a shorthand of cls.get(CLS_ID))
     */
    getId(): string;

    /**
     * run the callback in a shared cls context
     * (if run in an active context, creates a nested one
     * setting values in a nested context does not
     * overwrite those in the parent context)
     */
    run(callback: () => void): void;

    /**
     * run the callback in a shared cls context
     * and return the returned value from it
     */
    runAndReturn<T>(callback: () => T): T;

    /**
     * The underlying cls-hooked namespace object
     * in case you need the full functionality
     */
    readonly namespace: Namespace;
}
```

# Options

The `ClsModule.register` method takes the following options:

```ts
interface ClsModuleOptions {
    // The name of the cls namespace. This is the namespace
    // that will be used by the ClsService and ClsMiddleware/Interceptor
    // (most of the time you will not need to touch this setting)
    namespacName?: string;

    // whether to make the module global, so you don't need
    // to import `ClsModule` in other modules
    global?: boolean; // default false

    // additional middleware options
    // (should not be combined with interceptor)
    middleware?: ClsMiddlewareOptions;

    // additional interceptor options
    // (should not be combined with middleware)
    interceptor?: ClsInterceptorOptions;
}
```

```ts
interface ClsMiddlewareOrInterceptorOptions {
    // whether to mount the middleware/interceptor to every route
    mount?: boolean; // default false

    // whether to automatically generate request ids
    generateId?: boolean; // default false
}

interface ClsMiddlewareOptions extends ClsMiddlewareOrInterceptorOptions {
    // the function to generate request ids inside the middleware
    idGenerator?: (req: Request) => string | Promise<string>;
}

interface ClsInterceptorOptions extends ClsMiddlewareOrInterceptorOptions {
    // the function to generate request ids inside the interceptor
    idGenerator?: (context: ExecutionContext) => string | Promise<string>;
}
```

# Request ID

Because of a shared storage, CLS is an ideal tool for tracking request (correlation) id's for the purpose of logging. This package provides an option to automatically generate request ids in the middleware (or interceptor) and also provides a way to provide a custom ID generator function.

Depending on whether you chose a middleware or an interceptor, this method receives the `Request` or `ExecutionContext` as the first parameter, which can be used in the generation process.

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
        // -> logs for ex.: "<7tuihq103e> Hello"
    }
}
```

# (Namespaces)

> Warning: Namespace support is currently not ready, this section serves as a documentation of the future API and can change any time.

The default CLS namespace that the `ClsService` provides should be enough for most application, but should you need it, this package provides (will provide) a way to use multiple CLS namespaces in order to be fully compatible with `cls-hooked`.

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

To set up a custom namespaced cls context while using `ClsInterceptor`, decorate the route or controller with `@ClsNamespace('hello-namespace')`, otherwise, the default namespace will be set up and you won't be able to access the custom one unless you set it up manually with `myCls.run()` (or `myCls.runAndReturn()` if you care about the return value).

```ts
@Injectable()
export class HelloController {
    constructor(
        @InjectCls('hello-namespace')
        private readonly myCls: ClsService,
        private readonly helloService: HelloService,
    );

    // set up custom cls context using an interceptor
    @UseInterceptors(ClsInterceptor)
    @ClsNamespace('hello-namespace')
    @Get('/hello1')
    hello1() {
        this.myCls.set('hi', 'Hello');
        return this.helloService.sayHello();
    }

    @Get('/hello2')
    hello2() {
        // seting up cls context manually
        return this.myCls.runAndReturn(() => {
            this.myCls.set('hi', 'Hello');
            return this.helloService.sayHello();
        });
    }
}
```

## Custom CLS Middleware/Interceptor

The default middleware and interceptor provide some basic functionality, but you can replace them with custom ones if you need some custom logic handling the initialisation of the cls namespace;

### Custom CLS Middleware

```ts
@Injectable()
export class HelloClsMiddleware implements NestMiddleware {
    constructor(
        @InjectCls('hello-namespace')
        private readonly cls: ClsService,
    ) {}

    use(req: Request, res: Response, next: () => NextFunction) {
        this.cls.run(() => {
            // any custom logic
            next();
        });
    }
}
```

### Custom CLS Interceptor

```ts
@Injectable()
export class HelloClsInterceptorInterceptor implements NestInterceptor {
    constructor(
        @InjectCls('hello-namespace')
        private readonly cls: ClsService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return this.cls.runAndReturn(() => {
            // any custom logic
            return next.handle();
        });
    }
}
```

> Note: Middleware and Interceptor options passed to `ClsModule.register` do not apply here, so you will need to implement any custom logic (like the generation of request ids) manually.
