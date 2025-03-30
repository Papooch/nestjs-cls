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
