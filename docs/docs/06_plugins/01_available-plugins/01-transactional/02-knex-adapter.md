import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Knex adapter

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional-adapter-knex
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional-adapter-knex
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional-adapter-knex
```

</TabItem>
</Tabs>

## Registration

```ts
ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [
              // module in which the Knex is provided
              KnexModule
            ],
            adapter: new TransactionalAdapterKnex({
                // the injection token of the Knex client
                knexInstanceToken: KNEX,
            }),
        }),
    ],
}),
```

## Typing & usage

The `tx` property on the `TransactionHost<TransactionalAdapterKnex>` is typed as `Knex`.

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
        private readonly txHost: TransactionHost<TransactionalAdapterKnex>,
    ) {}

    async getUserById(id: number) {
        // highlight-start
        // txHost.tx is typed as Knex
        return this.txHost.tx('user').where({ id }).first();
        // highlight-end
    }

    async createUser(name: string) {
        return this.txHost
            .tx('user')
            .insert({ name: name, email: `${name}@email.com` })
            .returning('*');
    }
}
```
