# Breaking out of DI

While this package aims to be compatible with NestJS's Dependency Injection, it is also possible to access the CLS context outside of it.

For that, it provides the static `ClsServiceManager` class that exposes the `getClsService()` method which can be used to retrieve the context outside of Nest's injection context (e.g. in top-level functions)

```ts
function helper() {
    const cls = ClsServiceManager.getClsService();
    // you now have access to the shared storage
    console.log(cls.getId());
}
```

:::caution

**Please note**: Only use this feature where absolutely necessary. Using this technique instead of dependency injection will make it difficult to mock the ClsService and your code will become harder to test.

:::
