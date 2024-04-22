import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# TypeORM adapter

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional-adapter-typeorm
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional-adapter-typeorm
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional-adapter-typeorm
```

</TabItem>
</Tabs>

:::important

Please note that due to the deliberate choice to _not_ monkey-patch any underlying library, the only way to propagate the transaction using this adapter is by using the `EntityManager`. There is no transactional support for working directly with repositories without getting them through the (transactional) `EntityManager`

For a more fully-featured solution for TypeORM, see the [`typeorm-transactional`](https://github.com/Aliheym/typeorm-transactional) community package.

:::

## Registration

```ts

ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [
              // module in which the database instance is provided
              TypeOrmModule
            ],
            adapter: new TransactionalAdapterTypeOrm({
                // the injection token of the database instance
                dataSourceToken: DataSource,
            }),
        }),
    ],
}),
```

:::note

When using with `@nestjs/typeorm`, the data source token needs to be retrieved with the `getDataSourceToken` function, that can be optionally provided with a custom connection name.

```ts
import { getDataSourceToken } from '@nestjs/typeorm';
// ...
dataSourceToken: getDataSourceToken(),
```

:::

## Typing & usage

The `tx` property on the `TransactionHost<TransactionalAdapterTypeOrm>` is typed as [`EntityManager`](https://typeorm.io/working-with-entity-manager).

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
        private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    ) {}

    async getUserById(id: number) {
        // highlight-start
        // txHost.tx is typed as EntityManager
        return await this.txHost.tx.getRepository(User).findOneBy({ id });
        // highlight-end
    }

    async createUser(name: string, email: string) {
        return await this.txHost.tx.getRepository(User).save({
            name,
            email: `${name}@email.com`,
        });
    }
}
```
