# Usage outside of web request

Sometimes, a part of the app that relies on the CLS storage might need to be called outside of the context of a web request - for example, in a Cron job, while consuming a Queue, during the application bootstrap or in CLI apps.

In such cases, there are no enhancers that can be bound to the handler to set up the context.

Therefore, you as the the developer are responsible for wrapping the execution with `ClsService#run`, or using [the `@UseCls` decorator](../02_setting-up-cls-context/04_using-a-decorator.md). In any case, if any following code depends on some context variables, these need to be set up manually.

```ts
@Injectable()
export class CronController {
    constructor(
        private readonly someService: SomeService,
        private readonly cls: ClsService,
    );

    @Cron('45 * * * * *')
    async handleCronExample1() {
        // either explicitly wrap the function body with
        // a call to `ClsService#run` ...
        await this.cls.run(async () => {
            this.cls.set('mode', 'cron');
            await this.someService.doTheThing();
        });
    }

    @Cron('90 * * * * *')
    // ... or use the convenience decorator which
    // does the wrapping for you seamlessly.
    @UseCls({
        setup(cls) {
            cls.set('mode', 'cron');
        },
    })
    async handleCronExample2() {
        await this.someService.doTheThing();
    }
}
```

:::caution

Special care must be taken in case you're using [Proxy Providers](../03_features-and-use-cases/06_proxy-providers.md#outside-web-request).

:::
