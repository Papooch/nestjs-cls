# For library authors

If you are developing a library that depends on `nestjs-cls`, please make sure of the following:

## Use peer dependency

List `nestjs-cls` as a peer dependency in your `package.json` (under `peerDependencies`), this prevents multiple instances of the library from being installed in the same project, which can lead to dependency injection errors and loss of context.

## Do not import `forRoot`

In your library, never import the module as `ClsModule.forRoot()` or `ClsModule.forRootAsync()`. This prevents the application from setting up the `nestjs-cls` library correctly.

As with most other modules, importing a module `forRoot()` configures some global state, which can lead to unexpected behavior when used multiple times.

If your library code needs to inject `ClsService`, it should be done by importing the `ClsModule` statically, without calling `forRoot()`.

If you need to hook into the `setup` function to enrich the context, you can provide a custom function that the user must call manually, or provide a custom [Plugin](../06_plugins/index.md) and implement the `onClsInit` method, which is called right after `setup` in all enhancers.
