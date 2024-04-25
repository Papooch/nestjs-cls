import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import {
    ClsPluginTransactional,
    InjectTransactionHost,
    Transactional,
    TransactionHost,
} from '../src';
import {
    MockDbConnection,
    TransactionAdapterMock,
} from './transaction-adapter-mock';

@Injectable()
class CalledService {
    constructor(
        @InjectTransactionHost('test')
        private readonly txHost: TransactionHost<TransactionAdapterMock>,
    ) {}

    async doWork(num: number) {
        return this.txHost.tx.query(`SELECT ${num}`);
    }

    async doOtherWork(num: number) {
        return this.txHost.tx.query(`SELECT ${num}`);
    }
}

@Injectable()
class CallingService {
    constructor(
        private readonly calledService: CalledService,
        @InjectTransactionHost('test')
        private readonly txHost: TransactionHost<TransactionAdapterMock>,
    ) {}

    @Transactional('test')
    async transactionWithDecorator() {
        const q1 = await this.calledService.doWork(1);
        const q2 = await this.calledService.doOtherWork(2);
        return { q1, q2 };
    }

    @Transactional<TransactionAdapterMock>('test', { serializable: true })
    async transactionWithDecoratorWithOptions() {
        await this.calledService.doWork(1);
        await this.calledService.doOtherWork(2);
    }

    async parallelTransactions() {
        return Promise.all([
            this.nestedStartTransaction(7),
            this.calledService.doWork(9),
            this.nestedDecorator(8),
        ]);
    }

    @Transactional('test')
    private async nestedDecorator(num: number) {
        return this.calledService.doWork(num);
    }

    private async nestedStartTransaction(num: number) {
        return this.txHost.withTransaction(async () => {
            return this.calledService.doWork(num);
        });
    }

    async startTransaction() {
        return this.txHost.withTransaction(async () => {
            const q1 = await this.calledService.doWork(3);
            const q2 = await this.calledService.doOtherWork(4);
            return { q1, q2 };
        });
    }

    async startTransactionWithOptions() {
        await this.txHost.withTransaction({ serializable: true }, async () => {
            await this.calledService.doWork(3);
            await this.calledService.doOtherWork(4);
        });
    }

    async withoutTransaction() {
        await this.calledService.doWork(5);
        await this.calledService.doOtherWork(6);
    }
}

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
                    connectionName: 'test',
                    imports: [DbConnectionModule],
                    adapter: new TransactionAdapterMock({
                        connectionToken: MockDbConnection,
                    }),
                }),
            ],
        }),
    ],
    providers: [CallingService, CalledService],
})
class AppModule {}

describe('Transactional - named connections', () => {
    let module: TestingModule;
    let callingService: CallingService;
    let mockDbConnection: MockDbConnection;
    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        callingService = module.get(CallingService);
        mockDbConnection = module.get(MockDbConnection);
    });

    describe('when using the @Transactional decorator', () => {
        it('should start a transaction', async () => {
            const result = await callingService.transactionWithDecorator();
            expect(result).toEqual({
                q1: { query: 'SELECT 1' },
                q2: { query: 'SELECT 2' },
            });
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                [
                    'BEGIN TRANSACTION;',
                    'SELECT 1',
                    'SELECT 2',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
        it('should start a transaction with options', async () => {
            await callingService.transactionWithDecoratorWithOptions();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                [
                    'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRANSACTION;',
                    'SELECT 1',
                    'SELECT 2',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
        it('should start two transaction in parallel', async () => {
            const results = await callingService.parallelTransactions();
            expect(results).toEqual([
                { query: 'SELECT 7' },
                { query: 'SELECT 9' },
                { query: 'SELECT 8' },
            ]);
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                ['BEGIN TRANSACTION;', 'SELECT 7', 'COMMIT TRANSACTION;'],
                ['SELECT 9'],
                ['BEGIN TRANSACTION;', 'SELECT 8', 'COMMIT TRANSACTION;'],
            ]);
        });
    });
    describe('when using the startTransaction method on TransactionHost', () => {
        it('should start a transaction', async () => {
            const result = await callingService.startTransaction();
            expect(result).toEqual({
                q1: { query: 'SELECT 3' },
                q2: { query: 'SELECT 4' },
            });
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                [
                    'BEGIN TRANSACTION;',
                    'SELECT 3',
                    'SELECT 4',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
        it('should start a transaction with options', async () => {
            await callingService.startTransactionWithOptions();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                [
                    'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRANSACTION;',
                    'SELECT 3',
                    'SELECT 4',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
    });

    describe('when not using a transaction', () => {
        it('should not start a transaction', async () => {
            await callingService.withoutTransaction();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([['SELECT 5'], ['SELECT 6']]);
        });
    });
});
