import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Mongoose adapter

## Installation

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install @nestjs-cls/transactional-adapter-mongoose
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add @nestjs-cls/transactional-adapter-mongoose
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add @nestjs-cls/transactional-adapter-mongoose
```

</TabItem>
</Tabs>

## Registration

```ts
ClsModule.forRoot({
    plugins: [
        new ClsPluginTransactional({
            imports: [
                // module in which the Connection instance is provided
                MongooseModule,
            ],
            adapter: new TransactionalAdapterMongoose({
                // the injection token of the mongoose Connection
                mongooseConnectionToken: Connection,
            }),
        }),
    ],
});
```

## Typing & usage

To work correctly, the adapter needs to inject an instance of mongoose [`Connection`](<https://mongoosejs.com/docs/api/connection.html#Connection()>).

Due to how transactions work in MongoDB, [and in turn in Mongoose](https://mongoosejs.com/docs/transactions.html), the usage of the Mongoose adapter is a bit different from the others.

The `tx` property on the `TransactionHost<TransactionalAdapterMongoose>` does _not_ refer to any _transactional_ instance, but rather to a [`ClientSession`](https://mongodb.github.io/node-mongodb-native/6.7/classes/ClientSession.html) instance of `mongodb`, with an active transaction, or `null` when no transaction is active.

Queries are not executed using the `ClientSession` instance, but instead the `ClientSession` instance or `null` is passed to the query as the `session` option.

:::important

The `TransactionalAdapterMongoose` _does not support_ the ["Transaction Proxy"](./index.md#using-the-injecttransaction-decorator) feature, because proxying a `null` value is not supported by the JavaScript Proxy.

:::

:::note

MongoDB does not support savepoints or nested transactions. Using `Propagation.Nested` will re-use the existing transaction.

:::

## Example

```ts title="database.schemas.ts"
const userSchema = new Schema({
    name: String,
    email: String,
});

const User = mongoose.model('user', userSchema);
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
        const foundUser = await this.userRepository.getUserById(user._id);
        // highlight-end
        assert(foundUser._id === user._id);
    }
}
```

```ts title="user.repository.ts"
@Injectable()
class UserRepository {
    constructor(
        private readonly txHost: TransactionHost<TransactionalAdapterMongoose>,
    ) {}

    async getUserById(id: ObjectId) {
        // txHost.tx is typed as ClientSession
        return await User.findById(id)
            // highlight-start
            .session(this.txHost.tx);
        // highlight-end
    }

    async createUser(name: string) {
        const user = new User({ name: name, email: `${name}@email.com` });
        await user
            // highlight-start
            .save({ session: this.txHost.tx });
        // highlight-end
        return user;
    }
}
```

## Considerations

### Using with built-in Mongoose AsyncLocalStorage support

Mongoose > 8.4 has a built-in support for [propagating the `session` via `AsyncLocalStorage`](https://mongoosejs.com/docs/transactions.html#asynclocalstorage).

The feature is compatible with `@nestjs-cls/transactional` and when enabled, one _does not_ have to pass `TransactionHost#tx` to queries and still enjoy the simplicity of the `@Transactional` decorator, which starts and ends the underlying transaction automatically.

**However**, because `@nestjs-cls/transactional` has no control over the propagation of the `session` instance via Mongoose's `AsyncLocalStorage`,
there is **no implicit support for opting out of an ongoing transaction** via `TransactionHost#withoutTransaction` (or analogously the [`Propagation.NotSupported`](./index.md#transaction-propagation) mode).

To opt out of an ongoing transaction, you have to explicitly pass `null` to the `session` option when calling the query. Alternatively, you can explicitly pass in the value of `TransactionHost#tx` if the query should support both transactional and non-transactional mode and you want to control it using `Propagation`.
