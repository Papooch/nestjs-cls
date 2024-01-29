import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Kysely adapter

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional-adapter-kysely
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional-adapter-kysely
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional-adapter-kysely
```

</TabItem>
</Tabs>

## Registration

```ts
ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [
              // module in which the Kysely is provided
              KyselyModule
            ],
            adapter: new TransactionalAdapterKysely({
                // the injection token of the Kysely client
                kyselyInstanceToken: KYSELY,
            }),
        }),
    ],
}),
```

## Typing & usage

The `tx` property on the `TransactionHost<TransactionalAdapterKysely>` is typed as `Kysely<any>` by default. To get the full typing, you need to supply your database type as the type parameter for the `TransactionalAdapterKysely` when injecting it:

```ts
constructor(
    private readonly txHost: TransactionHost<
        TransactionalAdapterKysely<Database>
    >,
) {}
```

:::tip

This may get a bit too verbose, so you you might want to create a type alias for it:

```ts
type MyKyselyAdapter = TransactionalAdapterKysely<Database>;
```

and then inject it with

```ts
constructor(
    private readonly txHost: TransactionHost<MyKyselyAdapter>,
) {}
```

:::

## Example

```ts title="database.type.ts"
interface Database {
    user: User;
}

interface User {
    id: Generated<number>;
    name: string;
    email: string;
}
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
        private readonly txHost: TransactionHost<
            TransactionalAdapterKysely<Database>
        >,
    ) {}

    async getUserById(id: number) {
        // highlight-start
        // txHost.tx is typed as Kysely<Database>
        return this.txHost.tx
            .selectFrom('user')
            .where('id', '=', id)
            .selectAll()
            .executeTakeFirst();
        // highlight-end
    }

    async createUser(name: string) {
        return this.txHost.tx
            .insertInto('user')
            .values({
                name: name,
                email: `${name}@email.com`,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
}
```
