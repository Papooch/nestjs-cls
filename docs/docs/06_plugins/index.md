# Plugins

<small>**Since `v4.0`**</small>

Plugins are a way to enable pre-built integrations with other libraries and frameworks. They are a convenient way to enable many real-world use-cases without having to write much boilerplate code.

Plugins can hook into the lifecycle of the `ClsModule` and the CLS context setup of the `Cls-` initializers. They can also provide their own _Proxy-_ and regular providers to be used in the application.

## Usage

To use a plugin, pass it to the `forRoot` method of the `ClsModule`:

```ts
ClsModule.forRoot({
    // highlight-start
    plugins: [new MyPlugin()],
    // highlight-end
});
```

## Available plugins

For a list of plugins managed by the author of `nestjs-cls`, see the [Available Plugins](./01_available-plugins/index.md) page.

## Creating a plugin

To create a custom plugin, see the [Plugin API](./02_plugin-api.md) reference.
