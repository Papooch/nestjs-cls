import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Prisma adapter

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional-adapter-prisma
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional-adapter-prisma
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional-adapter-prisma
```

</TabItem>
</Tabs>

## Registration

```ts
ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [
              // module in which the PrismaClient is provided
              PrismaModule
            ],
            adapter: new TransactionalAdapterPrisma({
                // the injection token of the PrismaClient
                prismaInjectionToken: PrismaService,
                // specify the SQL flavor (if using SQL, see below)
                sqlFlavor: 'postgresql'
            }),
        }),
    ],
}),
```

:::important

The `prismaInjectionToken` is the token under which an instance of [`PrismaClient`](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction) provided. Usually, in Nest, this the custom `PrismaService` class which `extends PrismaClient` and is exported from a custom module.

:::

:::note

The `sqlFlavor` option is needed to enable nested transaction support via [`Propagation.Nested`](../01-transactional/index.md#transaction-propagation).

Since [Prisma _does not_ yet support nested transactions natively](https://github.com/prisma/prisma/issues/15212), the adapter implements a custom solution via raw queries and SQL _SAVEPOINTS_. But because different SQL flavors implement the syntax differently, and because Prisma also _does not provide a way to introspect the datasource provider name at runtime_, we need to specify it manually.

Please note that if the datasource in your Prisma schema and the SQL flavor do not match, syntax errors might be thrown when attempting to use nested transactions.

:::

## Typing & usage

The `tx` property on the `TransactionHost<TransactionalAdapterPrisma>` refers to the transactional `PrismaClient` instance when used in a transactional context. It is the instance that is passed to the `prisma.$transaction(( tx ) => { ... })` callback.

Outside of a transactional context, it refers to the regular `PrismaClient` instance (but is typed as the transactional one).

## Example

```ts title="user.service.ts"
@Injectable()
class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    @Transactional()
    async runTransaction() {
        // highlight-start
        // both methods are executed in the same transaction
        const user = await this.userRepository.createUser('John');
        const foundUser = await this.userRepository.getUserById(user.id);
        // highlight-end
        assert(foundUser.id === user.id);
    }
}
```

```ts title="user.repository.ts"
@Injectable()
class UserRepository {
    constructor(
        private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    ) {}

    async getUserById(id: number) {
        // highlight-start
        // txHost.tx is typed as the transactional PrismaClient
        return this.txHost.tx.user.findUnique({ where: { id } });
        // highlight-end
    }

    async createUser(name: string) {
        return this.txHost.tx.user.create({
            data: { name: name, email: `${name}@email.com` },
        });
    }
}
```

## Custom client type

<small>Since `1.1.0`</small>

By default, the adapter assumes that the Prisma client is available as `@prisma/client`. If you have a different setup, or you use some Prisma client _extensions_, you can provide a custom type for the client as a generic parameter of the adapter.

```ts
TransactionalAdapterPrisma<CustomPrismaClient>;
```

This type will need to be used whenever you inject the `TransactionHost` or `Transaction`

```ts
private readonly txHost: TransactionHost<TransactionalAdapterPrisma<CustomPrismaClient>>
```

Which becomes pretty verbose, so it's recommended to create a custom type alias for the adapter.

:::important

Please make sure you set up the module with the _custom_ prisma client and not the default one,
otherwise you would get a runtime error.

```ts
new ClsPluginTransactional({
    imports: [
        // module in which the PrismaClient is provided
        PrismaModule
    ],
    adapter: new TransactionalAdapterPrisma({
        // the injection token of the PrismaClient
        // highlight-start
        prismaInjectionToken: CUSTOM_PRISMA_CLIENT_TOKEN,
        // highlight-end
    }),
}),
```

:::
