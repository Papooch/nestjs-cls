# Quick Start

Below is an example of using this library to store the client's IP address in an interceptor and retrieving it in a service without explicitly passing it along.

:::note

This example assumes you are using HTTP and therefore can use middleware. For usage with non-HTTP transports, keep reading.

:::

### Register the ClsModule

Register the ClsModule and automatically mount the `ClsMiddleware` which wraps the entire request in a shared CLS context on all routes.

```ts title="app.module.ts"
@Module({
    imports: [
        // highlight-start
        ClsModule.forRoot({
            global: true,
            middleware: { mount: true },
        }),
        // highlight-end
    ],
    providers: [AppService],
    controllers: [AppController],
})
export class AppModule {}
```

### Create IP-address interceptor

Create an interceptor that

-   injects the `ClsService` to get access to the current shared CLS context,
-   extract the users's IP address from the request and stores it into the CLS context,

```ts title="user-ip.interceptor.ts"
@Injectable()
export class UserIpInterceptor implements NestInterceptor {
    // highlight-start
    constructor(private readonly cls: ClsService) {}
    // highlight-end

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const userIp = request.connection.remoteAddress;
        // highlight-start
        this.cls.set('ip', userIp);
        // highlight-end
        return next.handle();
    }
}
```

### Mount interceptor to controller

By mounting the `UserIpInterceptor` on the controller, it gets access to the same shared CLS context that the `ClsMiddleware` set up.

Of course, we could also bind the interceptor globally with `APP_INTERCEPTOR`.

```ts title="app.controller.ts"
// highlight-start
@UseInterceptors(UserIpInterceptor)
// highlight-end
@Injectable()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('/hello')
    hello() {
        return this.appService.sayHello();
    }
}
```

### Access CLS context in service

In the `AppService`, we can retrieve the user's IP from the CLS context without explicitly passing in anything, and without making the `AppService` request-scoped!

```ts title="app.service.ts"
@Injectable()
export class AppService {
    // highlight-start
    constructor(private readonly cls: ClsService) {}
    // highlight-end

    sayHello() {
        // highlight-start
        const userIp = this.cls.get('ip');
        // highlight-end
        return 'Hello ' + userIp + '!';
    }
}
```

### That's it

This is pretty much all there is to it. This library further further provides more quality-of-life features, so read on!

:::info

If your use-case is really simple, you can instead consider [creating a custom implementation with `AsyncLocalStorage`](https://docs.nestjs.com/recipes/async-local-storage#custom-implementation). Limiting the number of dependencies in your application is always a good idea!

:::
