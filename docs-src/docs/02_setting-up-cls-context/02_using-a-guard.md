# Using a Guard

The `ClsGuard` can be also used set up the CLS context. While it is not a "guard" per-se, it's the second best place to set up the CLS context, since after a middleware, it is the first piece of code that the request hits.

To use it, pass its configuration to the `guard` property to the `ClsModule.forRoot()` options:

## Automatically

Use `mount: true`

```ts title="app.module.ts"
@Module({
    imports: [
        ClsModule.forRoot({
            // highlight-start
            guard: { mount: true },
            // highlight-end
        }),
    ],
    // ...
})
export class AppModule {}
```

## Manually

If you need any other guards to use the `ClsService`, it's preferable to mount `ClsGuard` manually as the first guard in the root module:

```ts title="app.module.ts"
@Module({
    imports: [
        ClsModule.forRoot({
                        // highlight-start
            guard: { mount: false }
                        // highlight-end
        }),
    ]
    providers: [
        {
            // highlight-start
            provide: APP_GUARD,
            useClass: ClsGuard,
            // highlight-end
        },
    ],
    // ...
})
export class AppModule {}
```

or mount it directly on the Controller/Resolver with

```ts
@UseGuards(ClsGuard);
```

:::caution

**Please note**: since the `ClsGuard` uses the `AsyncLocalStorage#enterWith` method, using the `ClsGuard` comes with some [security considerations](#security-considerations)!

:::
