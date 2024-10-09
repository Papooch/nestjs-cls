# Using a Decorator

The `@UseCls()` decorator can be used at a method level to declaratively wrap the method with a `cls.run()` call. This method should only be used [outside of the context of a web request](../03_features-and-use-cases/04_usage-outside-of-web-request.md).

:::info

Please keep in mind, that since the CLS context initialization _can_ be async, the `@UseCls()` decorator can _only_ be used on _async_ function (those that return a `Promise`).

:::

Since there is no request, the `setup` function will not receive a `Request` object. Instead, it will receive the `this` context of the class instance (this also applies to the `idGenerator`), the `ClsService` reference and all the arguments passed to the decorated method.

```ts
@Injectable()
class SomeService {
    constructor(
        private readonly cls: ClsService,
        private readonly otherService: OtherService,
    ) {}

    @UseCls<[string]>({
        generateId: true,
        // highlight-start
        idGenerator: function (this: SomeService) {
            return this.generateId();
        },
        setup: function (this: SomeService, cls: ClsService, value: string) {
            cls.set('some-key', 'some-value');
        },
        // highlight-end
    })
    async startContextualWorkflow(value: string) {
        return this.otherService.doSomething(value);
    }

    private generateId() {
        return Math.random();
    }
}
```

:::warning

It is important to define the `setup` and `idGenerator` functions as `function`s, not arrow functions, so that the `this` context is properly bound.

:::

## Gotchas

Since the `@UseCls()` decorator operates on the method's parameters, it must be type-safe. In order to support this, it requires a generic type parameter, which is a tuple of the types of the method's arguments.

If there's a mismatch between the generic argument and the actual method signature, typescript will complain.

This also means that the decorator is not inherently compatible with Nest's `applyDecorators` function for decorator composition, because it would lose the type safety.

If you _need to_ use `@UseCls()` with `applyDecorators`, you have to cast it to to `MethodDecorator`, _knowing that type-safety will be lost_, e.g.:

```ts
export const ProcessWithCls = (queue: string) => {
    return applyDecorators(
        UseCls({
            /* options */
            // highlight-start
        }) as MethodDecorator,
        // highlight-end
        Process(queue),
    );
};
```
