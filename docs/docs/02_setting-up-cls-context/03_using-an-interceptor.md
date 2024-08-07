# Using an Interceptor

Another place to initiate the CLS context is an `ClsInterceptor`, which, unlike the `ClsGuard` uses `AsyncLocalStorage#run` method to wrap the following code, which is considered safer than `enterWith`.

To use it, pass its configuration to the `interceptor` property to the `ClsModule.forRoot()` options:

# Automatically

```ts title="app.module.ts"
@Module({
    imports: [
        ClsModule.forRoot({
            // highlight-start
            interceptor: { mount: true },
            // highlight-end
        }),
    ],
    // ...
})
export class AppModule {}
```

# Manually

Or mount it manually as `APP_INTERCEPTOR`

```ts title="app.module.ts"
@Module({
    imports: [
        ClsModule.forRoot({
            // highlight-start
            interceptor: { mount: false }
            // highlight-end
        }),
    ]
    providers: [
        {
            // highlight-start
            provide: APP_INTERCEPTOR,
            useClass: ClsInterceptor,
            // highlight-end
        },
    ],
    // ...
})
export class AppModule {}
```

or directly on the Controller/Resolver with:

```ts
@UseInterceptors(ClsInterceptor);
```

:::note

**Please note**: Since Nest's _Interceptors_ run after _Guards_, that means using this method makes CLS **unavailable in Guards** (and in case of REST Controllers, also in **Exception Filters**).

:::
