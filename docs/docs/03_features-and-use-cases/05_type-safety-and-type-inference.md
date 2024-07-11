# Type safety and type inference

> Since `v2.0`

By default the CLS context is untyped and allows setting and retrieving any `string` or `symbol` keys from the context. Some safety can be enforced by using `CONSTANTS` instead of magic strings, but that might not be enough.

## Type-safe ClsService

It is possible to specify a custom interface for the `ClsService` and get proper typing and automatic type inference when retrieving or setting values. This works even for _nested objects_ using a dot notation.

To create a typed CLS Store, start by creating an interface that extends `ClsStore`.

```ts title=my-cls-service.interface.ts
export interface MyClsStore extends ClsStore {
    tenantId: string;
    user: {
        id: number;
        authorized: boolean;
    };
}
```

### Using a type parameter

Then you can inject the `ClsService` with a type parameter `ClsService<MyClsStore>` to make use of the safe typing.

```ts
export class MyService {
    // highlight-start
    constructor(private readonly cls: ClsService<MyClsStore>) {}
    // highlight-end

    doTheThing() {
        // a boolean type will be enforced here
        this.cls.set('user.authorized', true);

        // tenantId will be inferred as a string
        const tenantId = this.cls.get('tenantId');

        // userId will be inferred as a number
        const userId = this.cls.get('user.id');

        // user will be inferred as { id: number, authorized: boolean }
        const user = this.cls.get('user');

        // you'll even get intellisense for the keys, because the type
        // will be inferred as:
        // symbol | 'tenantId˙ | 'user' | 'user.id' | 'user.authorized'

        // alternatively, since the `get` method returns the whole store
        // when called without arguments, you can use object destructuring
        const { tenantId, user } = this.cls.get();

        // accessing a nonexistent property will result in a type error
        const notExist = this.cls.get('user.name');
    }
}
```

### Using Typescript module augmentation

Alternatively, if you feel like using `ClsService<MyClsStore>` everywhere is tedious, you can instead globally [augment the `ClsStore interface`](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).

Now you don't need to specify the type parameter on `ClsService` to still get the string typing.

```ts
declare module 'nestjs-cls' {
    interface ClsStore {
        tenantId: string;
        user: {
            id: number;
            authorized: boolean;
        };
    }
}
```

### Using a custom provider

For even more transparent approach without augmenting the declaration, you can create a typed `ClsService` by extending it and creating a custom provider out of it:

```ts
export class MyClsService extends ClsService<MyClsStore> {}

@Module({
    imports: [ClsModule.forFeature()],
    providers: [
        {
            provide: MyClsService,
            useExisting: ClsService,
        },
    ],
    exports: [MyClsService],
})
class MyClsModule {}
```

Now you can inject `MyClsService` as an alias for `ClsService<MyClsStore>` without "polluting" the global type space.

:::important

Please note that in this case, the extended class acts only as an alternative _Injection token_. It doesn't allow you to extend the `ClsService` with custom methods (they wouldn't be accessible on the injected instance, because what gets injected is the original `ClsService`).

If you're thinking of extending the `ClsService`, please consider instead wrapping it in a custom provider (an adapter/facade if you will) that exposes only methods appropriate for your application and proxies calls to `ClsService`. If you still aren't convinced, please create a feature request and explain your reasoning.

:::

## Terminal Type

It can happen, that the object you want to store in the context is too complex, or contains cyclic references.

In that case, typescript might complain that _type instantiation is too deep, possibly infinite_. That is due to the fact that it tries to generate all possible paths inside the `ClsStore`. If that's the case, you can use the `Terminal` type to stop generating the paths for a certain subtree:

```ts
interface ClsStore {
    tenantId: string;
    // highlight-start
    user: Terminal<{
        id: number;
        authorized: boolean;
    }>;
    // highlight-end
}
```

This will only generate the paths `tenantId | user` and won't allow directly accessing nested keys (like `cls.get('user.id')`, but you'll still get fully typing for things like `const { id } = cls.get('user')`). See issue [#22](https://github.com/Papooch/nestjs-cls/issues/22) for more details.
