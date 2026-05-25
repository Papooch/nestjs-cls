import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Drizzle ORM adapter

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional-adapter-drizzle-orm
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional-adapter-drizzle-orm
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional-adapter-drizzle-orm
```

</TabItem>
</Tabs>

## Registration

```ts
ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [
              // module in which Drizzle is provided
              DrizzleModule
            ],
            adapter: new TransactionalAdapterDrizzleOrm({
                // the injection token of the Drizzle client instance
                drizzleInstanceToken: DRIZZLE,
            }),
        }),
    ],
}),
```

## Typing & usage

In Drizzle, the client type is inferred from the database type [_depending on the database driver_](https://orm.drizzle.team/docs/connect-overview).

For the typing to work properly, you need to provide the client type as the type parameter for the `TransactionalAdapterDrizzleOrm` when injecting it.

For example, if you create a client like this:

```ts
const drizzleClient = drizzle('<connection string>'{
    schema: {
        users,
    },
});
```

Then create a custom adapter type based on the client type:

```ts
type MyDrizzleAdapter = TransactionAdapterDrizzleOrm<typeof drizzleClient>;
```

And use it as a type parameter for `TransactionHost` when injecting it:

```ts
constructor(
    private readonly txHost: TransactionHost<MyDrizzleAdapter>,
) {}
```

## Example

This example assumes usage with Postgres together with `pg` and `drizzle-orm/pg-core`

```ts title="database.ts"
const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text().notNull(),
    email: text().notNull(),
});

const drizzleClient = drizzle(
    new Pool({
        connectionString: '<connection string>',
        max: 2,
    }),
    {
        schema: {
            users,
        },
    },
);

type DrizzleClient = typeof drizzleClient;
type MyDrizzleAdapter = TransactionAdapterDrizzleOrm<DrizzleClient>;
```

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
    constructor(private readonly txHost: TransactionHost<MyDrizzleAdapter>) {}

    async getUserById(id: number) {
        // highlight-start
        // txHost.tx is typed as DrizzleClient
        return this.txHost.tx.query.users.findFirst({
            where: eq(users.id, id),
        });
        // highlight-end
    }

    async createUser(name: string) {
        const created = await this.tx
            .insert(users)
            .values({
                name: name,
                email: `${name}@email.com`,
            })
            .returning()
            .execute();
        return created[0];
    }
}
```

## `better-sqlite3` (synchronous mode)

Most Drizzle drivers — `libsql`, `node-postgres`, `postgres-js`, `mysql2` — expose `db.transaction(callback)` as an _asynchronous_ API that awaits the callback's returned promise. `better-sqlite3` is different: its `db.transaction(fn)` is **synchronous** and rejects any callback that returns a `Promise`. Passing an `async` callback to it throws `Transaction function cannot return a promise`.

To opt into the synchronous transaction wrapper, set `transactionMode: 'sync'` on the adapter:

```ts
ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [DrizzleModule],
            adapter: new TransactionalAdapterDrizzleOrm({
                drizzleInstanceToken: DRIZZLE,
                // highlight-next-line
                transactionMode: 'sync',
            }),
        }),
    ],
});
```

In `'sync'` mode the inner transaction callback runs synchronously and the value it returns is wrapped in `Promise.resolve(...)` to satisfy the plugin's `wrapWithTransaction: Promise<T>` contract. The `@Transactional()`-decorated method **must itself be synchronous** — no `async`, no `await` inside — because `better-sqlite3` rejects any callback that returns a `Promise`.

```ts title="user.service.ts (better-sqlite3)"
@Injectable()
class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    // highlight-start
    // no `async` here — the method body runs synchronously inside the tx
    @Transactional()
    runTransaction() {
        const user = this.userRepository.createUser('John');
        const foundUser = this.userRepository.getUserById(user.id);
        assert(foundUser.id === user.id);
    }
    // highlight-end
}
```

The decorator itself still returns a `Promise<T>` to the caller (so consumers can `await runTransaction()` as usual). The synchronous constraint only applies _inside_ the method body, where `better-sqlite3` is driving the transaction.

`transactionMode` defaults to `'async'`, so existing setups using `libsql`, `node-postgres`, `postgres-js`, or `mysql2` keep working without any change.
