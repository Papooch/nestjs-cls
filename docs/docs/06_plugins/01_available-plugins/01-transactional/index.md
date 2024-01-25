import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# @nestjs-cls/transactional

The _Transactional_ plugin for `nestjs-cls` provides a generic interface that can be used to wrap any function call in
a CLS-enabled transaction by storing the transaction reference in the CLS context.

The transaction reference can be then retrieved in any other service and refer to the same transaction without having to pass it around.

The plugin is designed to be database-agnostic and can be used with any database library that supports transactions (via adapters). At the expense of using a [minimal wrapper](#using-the-transactionhost), it deliberately **does not require any monkey-patching** of the underlying library.

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional
```

</TabItem>
</Tabs>

The plugin works in conjunction with various adapters that provide the actual transactional logic and types for the underlying database library, so you'll need to install one of those as well.

Adapters for the following libraries are available:

-   Prisma (see [@nestjs-cls/transactional-adapter-prisma](./01-prisma-adapter.md))
-   Knex (see [@nestjs-cls/transactional-adapter-knex](./02-knex-adapter.md))

Adapters _will not_ be implemented for the following libraries:

-   TypeORM (since a more fully-featured [community package already exists](https://github.com/Aliheym/typeorm-transactional))
-   Sequelize (since it already includes a [built-in CLS-enabled transaction support](https://sequelize.org/docs/v6/other-topics/transactions/#automatically-pass-transactions-to-all-queries))

## Example

For this example, we'll use the `prisma` library and the [`@nestjs-cls/transactional-adapter-prisma` adapter](./01-prisma-adapter.md). Later, you'll learn how to [create your own adapter](10-creating-custom-adapter.md).

Suppose we already have a `PrismaModule` which provides a `PrismaClient` instance and two other services `UserService` and `AccountService` which we'd like to make transactional.

### Plugin registration

To add register the transactional plugin with `nestjs-cls`, we need to pass it to the `forRoot` method of the `ClsModule`:

```ts title="app.module.ts"
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
// ... other imports

@Module({
    imports: [
        PrismaModule,
        ClsModule.forRoot({
            plugins: [
                // highlight-start
                new ClsPluginTransactional({
                    // if PrismaModule is not global, we need to make it available to the plugin
                    imports: [PrismaModule],
                    adapter: new TransactionalAdapterPrisma({
                        // each adapter has its own options, see the adapter docs for more info
                        prismaInjectionToken: PrismaClient,
                    }),
                }),
                // highlight-end
            ],
        }),
    ],
    providers: [UserService, AccountService],
})
export class AppModule {}
```

This registers a `TransactionHost` provider in the global context which can be used to start a new transaction and retrieve the current transaction reference.

### Using the TransactionHost

Now that we have the plugin registered, we can use the `TransactionHost` to start a new transaction and retrieve the current transaction reference.

Suppose that any time we create an `User`, we want to create an `Account` for them as well and both operations must either succeed or fail. We can use the `TransactionHost` to start a new transaction and retrieve the current transaction reference.

The type argument on the `TransactionHost<Adapter>` makes sure that the `tx` property is typed correctly and the `withTransaction` method returns the correct type. This is ensured by the implementation of the adapter:

```ts title="user.service.ts"
@Injectable()
class UserService {
    constructor(
        // highlight-start
        private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
        // highlight-end
        private readonly accountService: AccountService,
    ) {}

    async createUser(name: string): Promise<User> {
        return this.txHost.withTransaction(async () => {
            const user = await this.txHost.tx.user.create({ data: { name } });
            await this.accountService.createAccountForUser(user.id);
            return user;
        });
    }
}
```

```ts title="account.service.ts"
@Injectable()
class AccountService {
    constructor(
        private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    ) {}

    async createAccountForUser(id: number): Promise<Account> {
        return this.txHost.tx.user.create({
            data: { userId: id, number: Math.random() },
        });
    }
}
```

:::note

Notice that we never used either raw `PrismaClient` or the `prisma.$transaction` directly. This is because the adapter takes care of that for us, otherwise the transaction would not be propagated in the CLS context.

:::

### Using the Transactional decorator

The `@Transactional` decorator can be used to wrap a method call in the `withTransaction` call implicitly. This saves a lot of boilerplate code and makes the code more readable.

Using the decorator, we can change the `createUser` method like so without changing the behavior:

```ts title="user.service.ts"
@Injectable()
class UserService {
    constructor(
        private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
        private readonly accountService: AccountService,
    ) {}

    @Transactional()
    async createUser(name: string): Promise<User> {
        const user = await this.txHost.tx.user.create({ data: { name } });
        await this.accountService.createAccountForUser(user.id);
        return user;
    }
}
```

### Passing transaction options

The both the `withTransaction` method and the `Transactional` decorator accepts an optional `TransactionOptions` object as the first argument. This object can be used to configure the transaction, for example to set the isolation level or the timeout.

The type of the object is provided by the adapter, so to enforce the correct type, you need to pass the adapter type argument to the `TransactionHost` or to the `Transactional` decorator.

```ts
// highlight-start
@Transactional<TransactionalAdapterPrisma>({ isolationLevel: 'Serializable' })
// highlight-end
async createUser(name: string): Promise<User> {
    const user = await this.txHost.tx.user.create({ data: { name } });
    await this.accountService.createAccountForUser(user.id);
    return user;
}
```

```ts
async createUser(name: string): Promise<User> {
    // highlight-start
    return this.txHost.withTransaction({ isolationLevel: 'Serializable' }, async () => {
    // highlight-end
        const user = await this.txHost.tx.user.create({ data: { name } });
        await this.accountService.createAccountForUser(user.id);
        return user;
    });
}
```

### Transaction propagation

Similar to how the `@Transactional` decorator work in [Spring](https://www.baeldung.com/spring-transactional-propagation-isolation) and other similar frameworks. The `@Transactional` decorator and the `withTransaction` method accept an optional `propagation` option as the _first parameter_ which can be used to configure how the transaction should be propagated.

The propagation option is controlled by the `Propagation` enum, which has the following values:

-   **_`Required`_**:
    (**default**) Reuse the existing transaction or create a new one if none exists.

-   **_`RequiresNew`_**:
    Create a new transaction even if one already exists.

-   **_`NotSupported`_**:
    Run without a transaction even if one exists.

-   **_`Mandatory`_**:
    Reuse an existing transaction, throw an exception otherwise

-   **_`Never`_**:
    Throw an exception if an existing transaction exists, otherwise create a new one

This parameter comes _before_ the `TransactionOptions` object, if one is provided. The default behavior when a nested transaction decorator is encountered if no propagation option is provided, is to reuse the existing transaction or create a new one if none exists, which is the same as the `Required` propagation option.

Example:

```ts title="user.service.ts"
@Injectable()
class UserService {
    constructor(
        private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
        private readonly accountService: AccountService,
    ) {}

    @Transactional(
        // highlight-start
        // Propagation.RequiresNew will always create a new transaction
        // even if one already exists.
        Propagation.RequiresNew,
        // highlight-end
    )
    async createUser(name: string): Promise<User> {
        const user = await this.txHost.tx.user.create({ data: { name } });
        await this.accountService.createAccountForUser(user.id);
        return user;
    }
}
```

```ts title="account.service.ts"
@Injectable()
class AccountService {
    constructor(
        private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    ) {}

    @Transactional<TransactionalAdapterPrisma>(
        // highlight-start
        // Propagation.Mandatory enforces that an existing transaction is reused,
        // otherwise an exception is thrown.
        Propagation.Mandatory,
        // When a propagation option is provided,
        // the transaction options are passed as the second parameter.
        {
            isolationLevel: 'Serializable',
        },
        // highlight-end
    )
    async createAccountForUser(id: number): Promise<Account> {
        return this.txHost.tx.user.create({
            data: { userId: id, number: Math.random() },
        });
    }
}
```

## ClsPluginTransactional Interface

The `ClsPluginTransactional` constructor takes an options object with the following properties:

-   **_`imports`_**`: any[]`  
    An array of NestJS modules that should be imported for the plugin to work. If the dependencies are available in the global context, this is not necessary.

-   **_`adapter`_**`: TransactionalAdapter`  
     An instance of the adapter that should be used for the plugin.

## TransactionHost Interface

The `TransactionHost` interface is the main working interface of the plugin. It provides the following API:

-   **_`tx`_**`: Transaction`  
    Reference to the currently active transaction. Depending on the adapter implementation for the underlying database library, this can be either a transaction client instance, a transaction object or a transaction ID. If no transaction is active, refers to the default non-transactional client instance (or undefined transaction ID).

-   **_`withTransaction`_**`(callback: Promise): Promise`\
    **_`withTransaction`_**`(options, callback): Promise`  
    **_`withTransaction`_**`(propagation, callback): Promise`  
    **_`withTransaction`_**`(propagation, options, callback): Promise`  
    Runs the callback in a transaction. Optionally takes `Propagation` and `TransactionOptions` as the first one or two parameters.

-   **_`withoutTransaction`_**`(callback): Promise`  
    Runs the callback without a transaction (even if one is active in the parent scope).

-   **_`isTransactionActive`_**`(): boolean`  
    Returns whether a CLS-managed transaction is active in the current scope.

### Transactional decorator interface

The `@Transactional` decorator can be used to wrap a method call in the `withTransaction` call implicitly. It has the following call signatures:

-   **_`@Transactional`_**`()`
-   **_`@Transactional`_**`(propagation)`
-   **_`@Transactional`_**`(options)`
-   **_`@Transactional`_**`(propagation, options)`

## Considerations

Please note that at this time, the `@nestjs-cls/transactional` plugin only supports a _single_ database connection per application. This means that if you have multiple databases, you can only use one of them with the transactional plugin.

This is a subject to change in the future, as there are plans to support multiple `TransactionHost` instances, each with their own adapter and a database connection.
