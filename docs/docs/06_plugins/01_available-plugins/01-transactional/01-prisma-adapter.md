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
            }),
        }),
    ],
}),
```

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
        const foundUser = await this.userRepository.getUserById(r1.id);
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

## Caveats

Since Prisma generates its own client to `node_modules`, this plugin works with the assumption that the types for the client are available as `@prisma/client`. If you have a different setup, you might need to use `declare module '@prisma/client'` to make typescript happy.
