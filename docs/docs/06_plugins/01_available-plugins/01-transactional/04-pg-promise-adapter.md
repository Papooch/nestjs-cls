import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Pg-promise adapter

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional-adapter-pg-promise
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional-adapter-pg-promise
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional-adapter-pg-promise
```

</TabItem>
</Tabs>

## Registration

```ts
import { txMode } from 'pg-promise'

ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [
              // module in which the database instance is provided
              DbModule
            ],
            adapter: new TransactionalAdapterPgPromise({
                // the injection token of the database instance
                dbInstanceToken: DB,

                // default transaction options (optional)
                defaultTxOptions: { mode: new txMode.TransactionMode({ tiLevel: txMode.isolationLevel.serializable }) }
            }),
        }),
    ],
}),
```

## Typing & usage

The `tx` property on the `TransactionHost<TransactionalAdapterPgPromise>` is typed as [`Database`](https://vitaly-t.github.io/pg-promise/Database.html).

`@Transactional()` takes an optional argument that is the same as the `option` argument to `Database.tx()` in `pg-promise` ([docs](https://vitaly-t.github.io/pg-promise/Database.html#tx)).

## Example

```ts title="user.service.ts"
@Injectable()
class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    @Transactional()
    async runTransaction() {
        // highlight-start
        // both methods are executed in the same transaction
        const user = await this.userRepository.createUser(
            'John',
            'john@acme.com',
        );
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
        private readonly txHost: TransactionHost<TransactionalAdapterPgPromise>,
    ) {}

    async getUserById(id: number) {
        // highlight-start
        // txHost.tx is typed as Database
        return this.txHost.tx.one(`SELECT * FROM user WHERE id = $1`, [id]);
        // highlight-end
    }

    async createUser(name: string, email: string) {
        return this.txHost.tx.none(
            `INSERT INTO user (name, email) VALUES ($1, $2)`,
            [name, email],
        );
    }
}
```
