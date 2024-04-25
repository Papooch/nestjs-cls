import { TransactionalAdapter } from '../src/lib/interfaces';

export class MockDbClient {
    private _operations: string[] = [];
    get operations() {
        return this._operations;
    }

    async query(query: string) {
        this._operations.push(query);
        return { query };
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

export class TransactionAdapterMock
    implements
        TransactionalAdapter<
            MockDbConnection,
            MockDbClient,
            MockTransactionOptions
        >
{
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
            let beginQuery = 'BEGIN TRANSACTION;';
            if (options?.serializable) {
                beginQuery =
                    'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; ' +
                    beginQuery;
            }
            if (options?.sayHello) {
                beginQuery = '/* Hello */ ' + beginQuery;
            }
            await client.query(beginQuery);
            try {
                const result = await fn();
                await client.query('COMMIT TRANSACTION;');
                return result;
            } catch (e) {
                await client.query('ROLLBACK TRANSACTION;');
                throw e;
            }
        },
        getFallbackInstance: () => {
            return connection.getClient();
        },
    });
}
