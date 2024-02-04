# Creating a custom adapter

If you can't find an adapter for a database library you want to use with `@nestjs-cls/transactional`, you can create a custom adapter. [See below for a step-by-step guide](#step-by-step-guide).

## Adapter interface

A transactional adapter is an instance of an object implementing the following interface:

```ts
interface TransactionalAdapter<TConnection, TTx, TOptions> {
    connectionToken: any;
    optionsFactory: TransactionalOptionsAdapterFactory<
        TConnection,
        TTx,
        TOptions
    >;
}
```

The `connectionToken` is an injection token under which the underlying database connection object is provided.

An options factory is a function that takes the injected connection object and returns the adapter options object of interface:

```ts
interface TransactionalAdapterOptions<TTx, TOptions> {
    wrapWithTransaction: (
        options: TOptions,
        fn: (...args: any[]) => Promise<any>,
        setTx: (client: TTx) => void,
    ) => Promise<any>;
    getFallbackInstance: () => TTx;
}
```

This object contains two methods:

-   `wrapWithTransaction` - a function that takes the method decorated with `@Transactional` (or a callback passed to `TransactionHost#withTransaction`) and wraps it with transaction handling logic. It should return a promise that resolves to the result of the decorated method.
    The other parameter is the adapter-specific transaction `options` object and the `setTx` function which should be called with the transaction instance to make it available in the CLS context.

-   `getFallbackInstance` - when a transactional context is not available, this method is used to return a "fallback" instance of the transaction object. This is needed for cases when the `tx` property on `TransactionHost` is accessed outside of a transactional context.

## Typing

The most important (and tricky) part of creating a custom adapter is to define the typing for the transaction instance.

It is important to note that the `tx` property of `TransactionHost` must work both _inside_ and _outside_ of a transactional context. Therefore it should not have any methods that are specific to a transactional context, because they would be unavailable outside of it (and cause runtime errors).

For an adapter, we're going to need to define the following types:

-   `TConnection` - a type of the "connection" object. This can be anything that lets us create an instance of the transaction.
-   `TTx` - a type of the transaction instance. This is the type of the `tx` property on `TransactionHost`.
-   `TOptions` - a type for the options object that is passed to the underlying library's transaction handling method.

## Step-by-step Guide

In this guide, we'll show step-by-step how to create a custom adapter for the [`knex`](https://knexjs.org/) library.

### How Knex handles transactions

First, let's take a look at how `knex` handles transactions and queries, so we can understand what we need to do to create a custom adapter for it.

```ts
import { Knex } from 'knex';

const knex = Knex({
    // [...] knex init settings
});

async function main() {
    // highlight-start
    // Knex uses the transaction method on the `knex` instance to start a new transaction.
    // highlight-end
    await knex.transaction(
        // highlight-start
        // The first parameter to the method is a callback that receives a `tx` object.
        // highlight-end
        async (tx) => {
            // highlight-start
            // Within the callback, the `tx` object refers to the same transaction instance.
            // This is what we'll need to store in the CLS context.
            // highlight-end
            await tx('users').insert({ name: 'John' });
            await tx('users').insert({ name: 'Jane' });
        },
        // highlight-start
        // And the second parameter is the transaction options.
        // highlight-end
        { isolationLevel: 'serializable' },
    );

    // highlight-start
    // The `knex` instance itself can be used to issue queries outside of
    // the transactional context. This is what we'll provide as the fallback.
    // highlight-end
    const users = await knex('users')
        .where({ name: 'John' })
        .orWhere({ name: 'Jane' });
}
```

### Deciding the typing for the Knex adapter

As seen above, we'll need to define the following types:

-   `TConnection` - This can be typed as `Knex` itself, because it's the type of the `knex` instance that we'll use to start the transaction.
-   `TTx` - While the type of the `tx` instance passed to `knex.transaction` is typed as `Knex.Transaction`, it also exposes methods that are specific to the transactional context. Therefore, we'll use the base `Knex` type here as well, because issuing queries is all that is really needed.
-   `TOptions` - Knex provides an existing type called `Knex.TransactionConfig` for the transaction options, so we'll just use that.

### Putting it all together

While the adapter itself can be any object that implements the `TransactionalAdapter` interface, we'll create a class that implements it.

```ts
export class MyTransactionalAdapterKnex
    implements TransactionalAdapter<Knex, Knex, Knex.TransactionConfig>
{
    // implement the property for the connection token
    connectionToken: any;

    // In the constructor, we can decide to accept a custom options object.
    // However, in this example, we'll just accept the connection token.
    constructor(myKnexInstanceToken: any) {
        this.connectionToken = myKnexInstanceToken;
    }

    //
    optionsFactory = (knexInstance: Knex) => {
        return {
            wrapWithTransaction: (
                options: Knex.TransactionConfig,
                fn: (...args: any[]) => Promise<any>,
                setTx: (client: Knex) => void,
            ) => {
                // highlight-start
                // We'll use the `knex.transaction` method to start a new transaction.
                // highlight-end
                return knexInstance.transaction(
                    (tx) => {
                        // highlight-start
                        // We'll call the `setTx` function with the `tx` instance
                        // to store it in the CLS context.
                        // highlight-end
                        setTx(tx);
                        // highlight-start
                        // And then we'll call the original method.
                        // highlight-end
                        return fn();
                    },
                    // highlight-start
                    // Don't forget to pass the options object, too
                    // highlight-end
                    options,
                );
            },
            // highlight-start
            // The fallback is the `knex` instance itself.
            // highlight-end
            getFallbackInstance: () => knexInstance,
        };
    };
}
```

### Using the custom adapter

Like any other adapter, you just pass an instance of it to the `adapter` option of `ClsPluginTransactional`:

```ts
ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            // Don't forget to import the module which provides the knex instance
            imports: [KnexModule],
            // highlight-start
            adapter: new MyTransactionalAdapterKnex(KNEX_TOKEN),
            // highlight-end
        }),
    ],
}),
```

When injecting the `TransactionHost`, type it as `TransactionHost<MyTransactionalAdapterKnex>` to get the correct typing of the `tx` property.

In a similar manner, use `@Transactional<MyTransactionalAdapterKnex>()` to get typing for the options object.
