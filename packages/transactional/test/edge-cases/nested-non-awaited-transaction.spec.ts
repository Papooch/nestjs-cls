import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional, TransactionHost } from '../../src';
import {
    MockDbConnection,
    TransactionAdapterMock,
} from '../transaction-adapter-mock';
import { Test, TestingModule } from '@nestjs/testing';

@Module({
    providers: [MockDbConnection],
    exports: [MockDbConnection],
})
class DbConnectionModule {}

@Module({
    imports: [
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [DbConnectionModule],
                    adapter: new TransactionAdapterMock({
                        connectionToken: MockDbConnection,
                    }),
                }),
            ],
        }),
    ],
})
class AppModule {}

describe('Nested transactions - edge cases', () => {
    let module: TestingModule;
    let txHost: TransactionHost<TransactionAdapterMock>;
    let mockDbConnection: MockDbConnection;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        txHost = module.get(TransactionHost);
        mockDbConnection = module.get(MockDbConnection);
    });

    describe('When a transaction is inherited in a non-awaited function', () => {
        it('Should not throw an error when trying to use the transaction after the parent function ends the transaction', async () => {
            const childTransaction = () =>
                txHost.withTransaction(async () => {
                    await txHost.tx.query('SELECT Child 1');
                    // simulate delay in the child transaction
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    await txHost.tx.query('SELECT Child 2'); // the client should throw here
                });
            let childPromise: Promise<void> | undefined = undefined;
            const parentTransaction = () =>
                txHost.withTransaction(async () => {
                    await txHost.tx.query('SELECT Parent 1');
                    childPromise = childTransaction(); // not awaited
                    // the transaction ends here
                });

            await parentTransaction();

            expect(childPromise).rejects.toThrow(
                'Transaction already finished',
            );
            expect(mockDbConnection.getClientsQueries()).toEqual([
                [
                    'BEGIN TRANSACTION;',
                    'SELECT Parent 1',
                    'SELECT Child 1',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
    });
});
