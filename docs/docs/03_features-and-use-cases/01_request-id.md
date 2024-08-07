# Request ID

Because of a shared storage, CLS is an ideal tool for tracking request (correlation) IDs for the purpose of logging. This package provides an option to automatically generate request IDs in the middleware/guard/interceptor, if you pass `{ generateId: true }` to its options. By default, the generated ID is a string based on `Math.random()`, but you can provide a custom function in the `idGenerator` option.

This function receives the `Request` (or the `ExecutionContext` in case the `interceptor` or the `guard` option is used) as the first parameter, which can be used in the generation process and should return (or resolve with) a string ID that will be stored in the CLS for later use.

Below is an example of retrieving the request ID from the request header with a fallback to an autogenerated one.

```ts
ClsModule.forRoot({
    middleware: {
        mount: true,
        // highlight-start
        generateId: true,
        idGenerator: (req: Request) =>
            req.headers['X-Request-Id'] ?? uuid();
        // highlight-end
    }
})
```

The ID is stored under the `CLS_ID` constant in the context. The `ClsService` provides a shorthand method `getId` to quickly retrieve it anywhere. It can be for example used in a custom logger:

```ts title="my.logger.ts"
@Injectable()
class MyLogger {
    constructor(private readonly cls: ClsService) {}

    log(message: string) {
        // highlight-start
        console.log(`<${this.cls.getId()}> ${message}`);
        // highlight-end
    }
}
```

Calling this from anywhere within a CLS context results in retrieving the ID:

```ts title="my.service.ts"
@Injectable()
class MyService {
    constructor(private readonly logger: MyLogger);

    hello() {
        this.logger.log('Hello');
        // -> logs for ex.: "<44c2d8ff-49a6-4244-869f-75a2df11517a> Hello"
    }
}
```
