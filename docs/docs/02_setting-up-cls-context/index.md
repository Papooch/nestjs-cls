# Setting up the CLS context

This package provides multiple methods of setting up the CLS context for incoming requests. This is mainly due to the fact that different underlying platforms are compatible with only some of these methods - see [Compatibility considerations](../05_considerations/02_compatibility.md).

For HTTP transports, the context can be preferably set up in a `ClsMiddleware`. For all other platforms, or cases where the `ClsMiddleware` is not applicable, this package also provides a `ClsGuard` and `ClsInterceptor`.

All of the "Cls-initializers" can be also used together to perform a more complex setup. The context will be initialized by the first one that the request passes through.

The `ClsModule` provides both `forRoot` and `forRootAsync` methods to configure these.

## Sync

```ts title="app.module.ts"
@Module({
    imports: [
        ClsModule.forRoot({
            global: true,
            middleware: {
                mount: true,
                generateId: true,
            },
        }),
    ],
    // ...
})
export class AppModule {}
```

## Async

```ts title="app.module.ts"
@Module({
    imports: [
        ClsModule.forRootAsync({
            global: true,
            inject: [IdGeneratorService]
            useFactory: (idGeneratorService) => ({
                middleware: {
                    mount: true,
                    generateId: true,
                    idGenerator: (req) => idGeneratorService.generate(req)
                },
            })
        }),
    ],
    // ...
})
export class AppModule {}
```
