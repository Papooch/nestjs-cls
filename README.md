# NestJS CLS

A continuation-local storage module compatible with [NestJS](https://nestjs.com/)'s dependency injection.

> Note: This package uses [cls-hooked](https://www.npmjs.com/package/cls-hooked) as a peer dependency. For more information about how CLS works, visit their docs.

# Outline

-   [Install](#install)
-   [Quick Start](#quick-start)
-   [How it works](#how-it-works)
-   [Options](#options)
-   [API](#api)
-   [Request ID](#request-id)
-   [Custom CLS Middleware](#custom-cls-middleware)
-   [Breaking out of DI](#breaking-out-of-di)
-   [Namespaces](#namespaces-experimental) (experimental)

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
        // Register the ClsModule and automatically mount the ClsMiddleware
        ClsModule.register({ middleware: { mount: true } }),
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

## Manually mounting the middleware

Sometimes, you might want to only use CLS on certain routes. In that case, you can bind the ClsMiddleware manually in the module:

```ts
export class TestHttpApp implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        apply(ClsMiddleware).forRoutes(AppController);
    }
}
```

Sometimes, however, that won't be enough, because the middleware could be mounted too late and you won't be able to use it in other middlewares if you need to. In that case, you can mount it directly in the bootstrap method:

```ts
function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // create and mount the middleware manually here
    app.use(new ClsMiddleware({}).use);
    await app.listen(3000);
}
```

> Please note: If you bind the middleware using `app.use()`, it will not respect middleware settings passed to `ClsModule.forRoot()`, so you will have to provide them yourself in the constructor.

# How it works

Continuation-local storage provides a common space for storing and retrieving data throughout the life of a function/callback call chain. In NestJS, this allows for sharing request data across the lifetime of a single request - without the need for request-scoped providers. It also makes it easy to track and log request ids throughout the whole application.

To make CLS work, it is required to set up a cls context first. This is done by passing a function as a callback to `cls.run()` (see cls-hooked docs). Once that is set up, anything that is called from within that function has access to the same storage with `cls.set()` and `cls.get()`.

Since in NestJS, HTTP middleware is the first thing to run when a request arrives, it is an ideal (and only) place to initialise the cls context. This package provides `ClsMidmidleware` that can be mounted to all (or selected) routes inside which the `next()` call is wrapped with `cls.run()`.

All you have to do is mount it to routes in which you want to use CLS, or pass `middleware: { mount: true }` to the `ClsModule.register` options which automatically mounts it to all routes.

Once that is set up, the `ClsService` will have access to a common storage in all _Guards, Interceptors, Pipes, Controllers, Services and Exception Filters_ that are called within that route.

> Note: Because we use middleware to wrap the request callback chain, it follows that this package **can only be used with HTTP** (express, fastify) with the full functionality. You can still use it with other transports, but you wouldn't be able to use CLS in enhancers (_Guards, Interceptors, Pipes, Exception Filters_), since I haven't found a way to wrap the incoming calls there. If you have any idea how that could be possible, please let me know.

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
    /**
     * The name of the cls namespace. This is the namespace
     * that will be used by the ClsService and ClsMiddleware/Interc
     * (most of the time you will not need to touch this setting)
     */
    namespaceName?: string;

    /**
     * whether to make the module global, so you don't need
     * to import `ClsModule` in other modules
     */
    global?: boolean;

    /**
     * Cls middleware options
     */
    middleware?: ClsMiddlewareOptions;
}

interface ClsMiddlewareOptions {
    /**
     * whether to mount the middleware to every route
     */
    mount?: boolean; // default false

    /**
     * whether to automatically generate request ids
     */
    generateId?: boolean; // default false

    /**
     * the function to generate request ids inside the middleware
     */
    idGenerator?: (req: Request) => string | Promise<string>;

    /**
     * Whether to store the Request object to the cls
     * It will be available under the CLS_REQ key
     */
    saveReq?: boolean; // default true

    /**
     * Whether to store the Response object to the cls
     * It will be available under the CLS_RES key
     */
    saveRes?: boolean; // default false
```

# Request ID

Because of a shared storage, CLS is an ideal tool for tracking request (correlation) ids for the purpose of logging. This package provides an option to automatically generate request ids in the middleware, if you pass `{ generateId: true }` to the middleware options. By default, the generated is a string based on `Math.random()`, but you can provide a custom function in the `idGenerator` option.

This function receives the `Request` as the first parameter, which can be used in the generation process.

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

# Custom CLS Middleware

The default middleware provides some basic functionality, but you can replace it with a custom one if you need some custom logic handling the initialisation of the cls namespace;

```ts
@Injectable()
export class HelloClsMiddleware implements NestMiddleware {
    constructor(private readonly cls: ClsService) {}

    use(req: Request, res: Response, next: () => NextFunction) {
        this.cls.run(() => {
            // any custom logic
            next();
        });
    }
}
```

> Note: Middleware options passed to `ClsModule.register` do not apply here, so you will need to implement any custom logic (like the generation of request ids) manually.

# Breaking out of DI

While this package aims to be compatible with NestJS's DI, it is also possible to access the CLS context outside of it. For that, it provides the static `ClsServiceManager` class that exposes the `getClsService()` method.

```ts
function helper() {
    const cls = ClsServiceManager.getClsService();
    // you now have access to the shared storage
    console.log(cls.getId());
}
```

# Namespaces (experimental)

> Warning: Namespace support is currently experimental no tests. This section serves as a documentation of the future API and can change any time.

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
        return this.myCls.runAndReturn(() => {
            this.myCls.set('hi', 'Hello');
            return this.helloService.sayHello();
        });
    }
}
```
