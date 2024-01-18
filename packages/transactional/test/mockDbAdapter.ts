import { TransactionalAdapter } from '../src/lib/interfaces';

export class MockDbClient {
    private _operations: string[] = [];
    get operations() {
        return this._operations;
    }

    async query(query: string) {
        this._operations.push(query);
        return { rows: [] };
    }
}

export class MockDbConnection {
    getClient() {
        return new MockDbClient();
    }
}

export class MockTransactionAdapter
    implements TransactionalAdapter<MockDbConnection, MockDbClient, any>
{
    connectionToken: any;
    constructor(options: { connectionToken: any }) {
        this.connectionToken = options.connectionToken;
    }
    optionsFactory = (connection: MockDbConnection) => ({
        startTransaction: async (
            options: any,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client: any) => void,
        ) => {
            const client = connection.getClient();
            setClient(client);
            await client.query('BEGIN');
            try {
                const result = await fn();
                await client.query('COMMIT');
                return result;
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            }
        },
        getClient: () => {
            return connection.getClient();
        },
    });
}
