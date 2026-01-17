import { TransactionalAdapter } from '../src/lib/interfaces';

export class MockDbClient {
    private finished = false;
    private _operations: string[] = [];
    get operations() {
        return this._operations;
    }

    async query(query: string) {
        if (this.finished) {
            throw new Error('Transaction already finished');
        }
        this._operations.push(query);
        return { query };
    }

    async begin(options?: MockTransactionOptions) {
        let beginQuery = 'BEGIN TRANSACTION;';
        if (options?.serializable) {
            beginQuery =
                'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; ' + beginQuery;
        }
        if (options?.sayHello) {
            beginQuery = '/* Hello */ ' + beginQuery;
        }
        await this.query(beginQuery);
    }

    async commit() {
        await this.query('COMMIT TRANSACTION;');
        this.finished = true;
    }

    async rollback() {
        await this.query('ROLLBACK TRANSACTION;');
        this.finished = true;
    }
}

export class MockDbConnection {
    clients: MockDbClient[] = [];

    getClient() {
        const client = new MockDbClient();
        this.clients.push(client);
        return client;
    }

    getClientsQueries() {
        return this.clients
            .map((c) => c.operations)
            .filter((o) => o.length > 0);
    }
}

export interface MockTransactionOptions {
    serializable?: boolean;
    sayHello?: boolean;
}

export class TransactionAdapterMock implements TransactionalAdapter<
    MockDbConnection,
    MockDbClient,
    MockTransactionOptions
> {
    connectionToken: any;
    defaultTxOptions: Partial<MockTransactionOptions>;

    constructor(options: {
        connectionToken: any;
        defaultTxOptions?: MockTransactionOptions;
    }) {
        this.connectionToken = options.connectionToken;
        this.defaultTxOptions = options.defaultTxOptions ?? {};
    }

    optionsFactory = (connection: MockDbConnection) => ({
        wrapWithTransaction: async (
            options: MockTransactionOptions | undefined,
            fn: (...args: any[]) => Promise<any>,
            setTxInstance: (client?: MockDbClient) => void,
        ) => {
            const client = connection.getClient();
            setTxInstance(client);
            await client.begin(options);
            try {
                const result = await fn();
                await client.commit();
                return result;
            } catch (e) {
                await client.rollback();
                throw e;
            }
        },
        wrapWithNestedTransaction: async (
            _options: MockTransactionOptions | undefined,
            fn: (...args: any[]) => Promise<any>,
            setTxInstance: (client?: MockDbClient) => void,
            tx: MockDbClient,
        ) => {
            setTxInstance(tx);
            try {
                await tx.query('SAVEPOINT nested_transaction;');
                const result = await fn();
                await tx.query('RELEASE SAVEPOINT nested_transaction;');
                return result;
            } catch (e) {
                await tx.query('ROLLBACK TO SAVEPOINT nested_transaction;');
                throw e;
            }
        },
        getFallbackInstance: () => {
            return connection.getClient();
        },
    });
}
