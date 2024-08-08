# Additional CLS Setup

The CLS middleware/guard/interceptor provide some default functionality, but sometimes you might want to store more contextual things in the CLS.

This can be of course done in a custom enhancer bound after, but for this scenario, the options expose a `setup` function, which will be executed in the enhancer right after the CLS context is set up.

The function receives the `ClsService` instance, and can be asynchronous.

## Middleware

In case of middleware the `Request` and `Response` objects are passed as the second and third parameters.

```ts
ClsModule.forRoot({
    middleware: {
        mount: true,
        // highlight-start
        setup: (cls, req: Request, res: Response) => {
            cls.set('TENANT_ID', req.params['tenantId']);
            cls.set('AUTH', { authenticated: false });
        },
        // highlight-end
    },
});
```

## Enhancers

In a guard or interceptor, the `ExecutionContext` object is passed as a second parameter.

```ts
ClsModule.forRoot({
    interceptor: {
        mount: true,
        // highlight-start
        setup: (cls, context) => {
            const req = context.switchToHttp().getRequest<Request>();
            cls.set('TENANT_ID', req.params['tenantId']);
            cls.set('AUTH', { authenticated: false });
        },
        // highlight-end
    },
});
```

:::info

The examples assume usage of _Express_ by default. In case of using _Fastify_, the types of request and response objects are `FastifyRequest` and `FastifyReply`, respectively.

:::
