# Plugin API

:::warning

The Plugin API is still experimental and might change in the future, you should not rely on it in production.

Using any of the "official" plugins is safe since they are maintained by the same author. If you want to create your own plugin, you should be aware that the API might change between minor versions.

:::

A plugin is, in its core, a NestJS module with some extra options and should implement the following interface:

```ts
export interface ClsPlugin {
    /**
     * The name of the plugin, used for logging and debugging
     */
    name: string;

    /**
     * Function that is called within a Cls initializer (middleware, interceptor, guard, etc.)
     */
    onClsInit?: (cls: ClsService) => void | Promise<void>;

    /**
     * A lifecycle method called when the `ClsModule` is initialized
     */
    onModuleInit?: () => void | Promise<void>;

    /**
     * A lifecycle method called when the `ClsModule` is destroyed (only when shutdown hooks are enabled)
     */
    onModuleDestroy?: () => void | Promise<void>;

    /**
     * An array of external modules that should be imported for the plugin to work.
     */
    imports?: any[];

    /**
     * An array of providers that the plugin provides.
     */
    providers?: Provider[];

    /**
     * An array of providers that the plugin provides that should be exported.
     */
    exports?: any[];
}
```

The plugin options are then mixed into a _global_ `ClsPluginModule` and the exposed providers can be used for injection by other plugin-related code.
