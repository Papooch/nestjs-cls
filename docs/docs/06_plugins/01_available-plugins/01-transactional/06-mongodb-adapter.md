import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# MongoDB adapter

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional-adapter-mongodb
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional-adapter-mongodb
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional-adapter-mongodb
```

</TabItem>
</Tabs>

## Registration

```ts
ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [
              // module in which the MongoClient client is provided
              MongoDBModule
            ],
            adapter: new TransactionalAdapterMongoDB({
                // the injection token of the MongoClient
                mongoClientToken: MONGO_CLIENT,
            }),
        }),
    ],
}),
```

## Typing & usage

Due to how [transactions work in MongoDB](https://www.mongodb.com/docs/drivers/node/current/fundamentals/transactions), the usage of the `MongoDBAdapter` adapter is a bit different from the others.

The `tx` property on the `TransactionHost<TransactionalAdapterMongoDB>` does _not_ refer to any _transactional_ instance, but rather to a `ClientSession` instance.

Queries are not executed using the `ClientSession` instance, but instead the `ClientSession` instance must be passed to the query. The `TransactionalAdapterMongoDB` ensures, that the `ClientSession` provided under the `tx` property refers to a session in which a transaction was started. Outside of a transaction a fallback `ClientSession` _without_ a started transaction is used.

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
        @Inject(MONGO_CLIENT)
        private readonly mongoClient: MongoClient, // we are using a regular mongoClient here
        private readonly txHost: TransactionHost<TransactionalAdapterMongoDB>,
    ) {}

    async getUserById(id: ObjectId) {
        // txHost.tx is typed as Knex
        return this.mongoClient.db('default').collection('user').findOne(
            { _id: id },
            // highlight-start
            { session: this.txHost.tx }, // here, the `tx` is passed as the `session`
            // highlight-end
        );
    }

    async createUser(name: string) {
        const created = await this.mongo
            .db('default')
            .collection('user')
            .insertOne(
                { name: name, email: `${name}@email.com` },
                // highlight-start
                { session: this.txHost.tx }, // here, the `tx` is passed as the `session`
                // highlight-end
            );
        const createdId = created.insertedId;
        const createdUser = await this.getUserById(createdId);
        return createdUser;
    }
}
```
