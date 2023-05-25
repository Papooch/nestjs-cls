# Using a Middleware

:::info

This section applies only if you use a HTTP transport (REST or GraphQL)

:::

Since in NestJS, HTTP **middleware** is the first thing to run when a request arrives, it is an ideal place to initialise the CLS context. This package provides `ClsMiddleware` that can be mounted to all (or selected) routes inside which the context is set up before the `next()` call.

All you have to do is mount it to routes in which you want to use CLS, or pass `middleware: { mount: true }` to the `ClsModule.forRoot()` options which automatically mounts it to all routes.

Once that is set up, the `ClsService` will have access to a common storage in all _Guards, Interceptors, Pipes, Controllers, Services and Exception Filters_ that are called within that route.

## Automatically

```ts title="app.module.ts"
@Module({
    imports: [
        ClsModule.forRoot({
            global: true,
            // highlight-start
            middleware: { mount: true },
            // highlight-end
        }),
    ],
    // ...
})
export class AppModule {}
```

## Manually

Sometimes, you might want to only use CLS on certain routes, or you need to have more control over the order of middleware registration in combination with other middlewares.

### In the module

In that case, omit the `mount` option or set it to `false` and bind the `ClsMiddleware` manually in the module:

```ts title="app.module.ts"
@Module({
    imports: [
        ClsModule.forRoot({
            global: true,
            // highlight-start
            middleware: { mount: false },
            // highlight-end
        }),
    ],
    // ...
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // highlight-start
        consumer.apply(ClsMiddleware).forRoutes('custom/route');
        // highlight-end
    }
}
```

### Using app.use

Sometimes, however, the previous method won't be enough, because the middleware could be mounted too late and you won't be able to use it in other middlewares that need to run prior to that - for example, the API versioning feature of NestJS apparently interferes with the order, see issue [#67](https://github.com/Papooch/nestjs-cls/issues/67).

In that case, you can mount it directly in the bootstrap method:

```ts title="main.ts"
function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // create and mount the middleware manually here
    app.use(
        // highlight-start
        new ClsMiddleware({
            /* ...settings */
        }).use,
        // highlight-end
    );
    await app.listen(3000);
}
```

:::caution

**Please note**: If you bind the middleware using `app.use()`, it will not respect middleware settings passed to `ClsModule.forRoot()`, so you will have to provide them yourself in the constructor.

:::
