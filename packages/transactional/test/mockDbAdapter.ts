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
        return this.clients.map((c) => c.operations);
    }
}

export interface MockTransactionOptions {
    serializable?: boolean;
}

export class MockTransactionAdapter
    implements
        TransactionalAdapter<
            MockDbConnection,
            MockDbClient,
            MockTransactionOptions
        >
{
    connectionToken: any;
    constructor(options: { connectionToken: any }) {
        this.connectionToken = options.connectionToken;
    }
    optionsFactory = (connection: MockDbConnection) => ({
        startTransaction: async (
            options: MockTransactionOptions | undefined,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: MockDbClient) => void,
        ) => {
            const client = connection.getClient();
            setClient(client);
            let beginQuery = 'BEGIN TRANSACTION;';
            if (options?.serializable) {
                beginQuery =
                    'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; ' +
                    beginQuery;
            }
            await client.query(beginQuery);
            try {
                const result = await fn();
                await client.query('COMMIT TRANSACTION;');
                return result;
            } catch (e) {
                await client.query('ROLLBACK TRANSACTION;');
                throw e;
            } finally {
                setClient(undefined);
            }
        },
        getClient: () => {
            return connection.getClient();
        },
    });
}
