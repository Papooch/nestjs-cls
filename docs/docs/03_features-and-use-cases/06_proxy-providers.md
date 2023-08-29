# Proxy Providers

> Since `v3.0`

This feature was inspired by how REQUEST-scoped providers (_"beans"_) work in the Spring framework for Java/Kotlin.

Using this technique, NestJS does not need to re-create a whole DI-subtree on each request (which has [certain implications which disallows the use of REQUEST-scoped providers in certain situations](https://docs.nestjs.com/fundamentals/injection-scopes#scope-hierarchy)).

Rather, it injects a _SINGLETON_ [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) instance, which delegates access and calls to the actual instance, which is created for each request when the CLS context is set up.

There are two kinds of Proxy providers - [_Class_](#class-proxy-providers) and [_Factory_](#factory-proxy-providers).

:::note

Please note that there are [_some caveats_](#caveats) to using this technique.

:::

## Class Proxy Providers

These providers look like your regular class providers, with the exception that is the `@InjectableProxy()` decorator to make them easily distinguishable.

```ts title=user.proxy.ts
// highlight-start
@InjectableProxy()
// highlight-end
export class User {
    id: number;
    role: string;
}
```

To register the proxy provider, use the `ClsModule.forFeature()` registration,
which exposes it an injectable provider in the parent module.

```ts
ClsModule.forFeature(User);
```

It can be then injected using the class name.

However, what will be actually injected _is not_ the instance of the class, but rather the Proxy which redirects all access to an unique instance stored in the CLS context.

### Populate in an enhancer

A Class provider defined in this way will be empty upon creation, so we must assign context values to it somewhere. One place to do it is an interceptor

```ts title=user.interceptor.ts
@Injectable()
export class UserInterceptor implements NestInterceptor {
    // we can inject the proxy here
    // highlight-start
    constructor(private readonly user: User) {}
    // highlight-end

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        // and assign or change values as it was a normal object
        // highlight-start
        this.user.id = request.user.id;
        this.user.role = 'admin';
        // highlight-end

        return next.handle();
    }
}
```

### Self-populating Proxy Provider

It is also possible to inject other providers into the Proxy Provider to avoid having to do this in a separate component.

For the convenience, the `CLS_REQ` and `CLS_RES` are also made into Proxy Providers and are exported from the `ClsModule`.

```ts title=user-with-rile.proxy.ts
@InjectableProxy()
export class UserWithRole {
    id: number;
    role: string;

    constructor(
        // highlight-start
        @Inject(CLS_REQ) request: Request,
        // highlight-end
        roleService: RoleService,
    ) {
        this.id = request.user.id;
        this.role = roleService.getForId(request.user.id);
    }
}
```

If you need to inject a provider from an external module, use the `ClsModule.forFeatureAsync()` registration to import the containing module.

```ts
ClsModule.forFeatureAsync({
    // make RoleService available to the Proxy provider
    import: [RoleModule],
    useClass: UserWithRole,
});
```

:::tip

Using `@Inject(CLS_REQ)`, you can entirely replace `@Inject(REQUEST)` in REQUEST-SCOPED providers to turn them into CLS-enabled singletons without changing the implementation.

:::

## Factory Proxy Providers

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

```ts title=dogs.service.ts
@Injectable()
class DogsService {
    constructor(
        @Inject(TENANT_CONNECTION)
        private readonly connection: TenantConnection,
    ) {}

    getAll() {
        return this.connection.dogs.getAll();
    }
}
```

## Caveats

### No primitive values

Proxy Factory providers _cannot_ return a _primitive value_. This is because the provider itself is the Proxy and it only delegates access once a property or a method is called on it (or if it itself is called in case the factory returns a function).

### `typeof` Proxies is always `function`

In order to support injecting proxies of _functions_, the underlying proxy _target_ is an empty function, too. It must be this way in order to be able to implement the "apply" trap.

As a result of this, calling `typeof` on an instance of a Proxy will always return `function`, regardless of the value it holds. This is fine for most applications, but must be taken into consideration in some cases - please see [Issue #82](https://github.com/Papooch/nestjs-cls/issues/82) for more info and possible workarounds.

## Delayed resolution of Proxy Providers

By default, proxy providers are resolved as soon as the `setup` function in an enhancer (middleware/guard/interceptor) finishes. For some use cases, it might be required that the resolution is delayed until some later point in the request lifecycle once more information is present in the CLS .

To achieve that, set `resolveProxyProviders` to `false` in the enhancer options and call `ClsService#resolveProxyProviders()` manually at any time.

```ts
ClsModule.forRoot({
    middleware: {
        // highlight-start
        resolveProxyProviders: false,
        // highlight-end
    },
});
```

### Outside web request

This is also necessary [outside the context of web request](./04_usage-outside-of-web-request.md), otherwise all access to an injected Proxy Provider will return `undefined`.

#### With cls.run()

If you set up the context with `cls.run()` to wrap any subsequent code thar relies on Proxy Providers.

```ts title=cron.controller.ts
@Injectable()
export class CronController {
    constructor(
        private readonly someService: SomeService,
        private readonly cls: ClsService,
    );

    @Cron('45 * * * * *')
    async handleCron() {
        await this.cls.run(async () => {
            // prepare the context
            this.cls.set('some-key', 'some-value');
            // highlight-start
            // trigger Proxy Provider resolution
            await this.cls.resolveProxyProviders();
            // highlight-end
            await this.someService.doTheThing();
        });
    }
}
```

#### With @UseCls()

The `resolveProxyProviders` is set to `false` by default on the `@UseCls` decorator. To achieve the same behavior using it, you must set it to `true`.

The Proxy Providers will be resolved after the `setup` phase.

```ts title=cron.controller.ts
@Injectable()
export class CronController {
    constructor(private readonly someService: SomeService);

    @Cron('45 * * * * *')
    @UseCls({
        // highlight-start
        resolveProxyProviders: true,
        setup: (cls) => {
            this.cls.set('some-key', 'some-value');
        },
        // highlight-end
    })
    async handleCron() {
        await this.someService.doTheThing();
    }
}
```
