# Plugin API

:::info

The Plugin API is stable since `v6.0.0` and should only change between major versions.

Any of the "official" plugins will always be kept in sync and updated to be compatible with any new version of the Plugin API.

:::

## Overview

A plugin provides a way to hook into the lifecycle of the `setup` phase of Cls-initializers (middleware, interceptor, guard, decorator) and modify/extend the contents of CLS Store.

Every plugin must implement the `ClsPlugin` interface and have a **globally unique name** that is used to identify its components in the DI system.

A plugin is, it its essence, just a NestJS module that can register its own providers and standard NestJS lifecycle hooks. These providers will be available in the DI system everywhere that `ClsService` is available.

## Plugin interface

```ts
interface ClsPlugin {
    readonly name: string;

    imports?: any[];
    providers?: Provider[];
    exports?: any[];

    onModuleInit?: () => void | Promise<void>;
    onModuleDestroy?: () => void | Promise<void>;
    onApplicationBootstrap?: () => void | Promise<void>;
    onApplicationShutdown?: (signal?: string) => void | Promise<void>;
    beforeApplicationShutdown?: (signal?: string) => void | Promise<void>;
}
```

## CLS Hooks

As mentioned above, a plugin can register a special provider that implements the `ClsPluginHooks` interface. This provider should be registered under the `getPluginHooksToken(<pluginName>)` token, where `pluginName` is the name of the plugin.

```ts
interface ClsPluginHooks {
    beforeSetup?: (
        cls: ClsService,
        context: ClsInitContext,
    ) => void | Promise<void>;

    afterSetup?: (
        cls: ClsService,
        context: ClsInitContext,
    ) => void | Promise<void>;
}
```

This interface can contain two methods: `beforeSetup` and `afterSetup`. These methods are called before and after the `setup` phase of the Cls-initializers and have access to the `ClsService` and the `ClsInitContext` object.

Since the plugin cannot know which Cls-initializer is being used, it is up to the plugin to check the `ClsInitContext` object and decide what to do. The `ClsInitContext` will always contain the `kind` property, with a value of either `middleware`, `interceptor`, `guard`, `decorator` or `custom`. and other properties depending on the kind of Cls-initializer.

A plugin author should indicate in the documentation which Cls-initializers are supported by the plugin, if there are any limitations. Otherwise, the plugin should be able to work with any Cls-initializer.

## Creating a plugin

Implementing the aforementioned interface and supplying the (optional) hooks provider is all that is needed to create a plugin. And instance of the plugin can be passed to the `plugins` array of the `ClsModule` options.

However, the `nestjs-cls` package exports a `ClsPluginBase` class, that can be extended to easily create a plugin.

In this example, we will implement a plugin that extracts the `user` property from the request and wraps it in a custom [Proxy provider](../03_features-and-use-cases/06_proxy-providers.md) for injection.

The plugin will work in the following way:

1. First, check if the `user` property is already set in the CLS Store. If it is, do nothing (in case the user registers multiple initializers).
2. Determine the kind of Cls-initializer that is being used and add the `user` property to the CLS Store.
3. Register a custom `ClsUserHost` proxy provider that hosts the `user` property for injection anywhere in the application.

```ts
// Define a symbol as a key in the CLS Store
export const USER_CLS_SYMBOL = Symbol('user');

// Define a custom proxy provider that hosts the user property
@InjectableProxy()
export class ClsUserHost {
    public readonly user: MyUserType;

    constructor(private readonly cls: ClsService) {
        this.user = this.cls.get<MyUserType>(USER_CLS_SYMBOL);
    }
}

// To Create the plugin, extend the ClsPluginBase class
export class UserPlugin extends ClsPluginBase {
    constructor() {
        // Specify a unique name for the plugin
        super('user-plugin');

        // Register the plugin hooks using the convenience method
        this.registerHooks({
            useFactory: () => ({
                afterSetup(cls, context) {
                    // This hook will be called after the setup phase of every Cls-initializer
                    // so we check if the user property is already set and do nothing
                    if (cls.has(USER_CLS_SYMBOL)) {
                        return;
                    }

                    // If the user property is not set, we check the kind of Cls-initializer
                    switch (context.kind) {
                        case 'middleware':
                            cls.set(USER_CLS_SYMBOL, context.req.user);
                            break;
                        case 'interceptor':
                            cls.set(
                                USER_CLS_SYMBOL,
                                context.ctx.switchToHttp().getRequest().user,
                            );
                            break;
                        case 'guard':
                            cls.set(
                                USER_CLS_SYMBOL,
                                context.ctx.switchToHttp().getRequest().user,
                            );
                            break;
                        default:
                            // If the kind is not supported (decorator or custom), we throw an error,
                            // because there is no request.
                            // If the user wants to use the plugin in a decorator or a custom
                            // Cls-initializer, they should set the user property manually
                            // in the `setup` method of the Decorator
                            throw new Error(
                                `Unsupported context kind: ${context.kind}`,
                            );
                    }
                },
            }),
        });

        // Register the custom Proxy provider
        this.imports.push(ClsModule.forFeature(ClsUserHost));
    }
}
```

:::info

It is also possible to expose the User itself as Proxy provider without the need of the plugin. This is only for demonstration purposes.

:::

## Using plugin options

If we wanted to customize the plugin and allow the user to be retrieved from a custom property name from the request, we could do it by adding some options to the plugin constructor.

```ts
export class UserPlugin extends ClsPluginBase {
    // highlight-start
    constructor(userPropertyName: string) {
    // highlight-end
        // Specify a unique name for the plugin
        super('user-plugin');

// [...]
                afterSetup(cls, context) {

                    switch (context.kind) {
                        case 'middleware':
                            // highlight-start
                            cls.set(USER_CLS_SYMBOL, context.req[userPropertyName]);
                            // highlight-end
                            break;
```

A more advanced use-case would be to allow passing the options asynchronously. For that, we can use the `imports` array and the `inject` method on the `this.registerHooks` method. An example can be found in the implementation of the existing plugins.
