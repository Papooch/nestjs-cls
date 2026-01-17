import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import {
    ClsPluginTransactional,
    InjectTransaction,
    InjectTransactionHost,
    Transaction,
    Transactional,
    TransactionHost,
    TransactionProxyUnsupportedError,
} from '../src';
import {
    MockDbConnection,
    TransactionAdapterMock,
} from './transaction-adapter-mock';

class CalledService {
    constructor(private readonly tx: Transaction<TransactionAdapterMock>) {}

    async doWork(num: number) {
        return this.tx.query(`SELECT ${num}`);
    }
}

@Injectable()
class CalledService1 extends CalledService {
    constructor(
        @InjectTransaction('named-connection')
        txHost: Transaction<TransactionAdapterMock>,
    ) {
        super(txHost);
    }
}

@Injectable()
class CalledService2 extends CalledService {
    constructor(
        @InjectTransaction()
        txHost: Transaction<TransactionAdapterMock>,
    ) {
        super(txHost);
    }
}

@Injectable()
class CallingService {
    constructor(
        private readonly calledService1: CalledService1,
        private readonly calledService2: CalledService2,
        @InjectTransactionHost('named-connection')
        private readonly txHost1: TransactionHost<TransactionAdapterMock>,
        @InjectTransactionHost()
        private readonly txHost2: TransactionHost<TransactionAdapterMock>,
    ) {}

    async twoUnrelatedTransactionsWithDecorators() {
        const [q1, q2] = await Promise.all([
            this.nestedStartTransaction1(1),
            this.nestedStartTransaction2(2),
        ]);
        return { q1, q2 };
    }

    @Transactional('named-connection')
    private async nestedStartTransaction1(num: number) {
        return this.calledService1.doWork(num);
    }

    @Transactional()
    private async nestedStartTransaction2(num: number) {
        return this.calledService2.doWork(num);
    }

    async twoUnrelatedTransactionsWithStartTransaction() {
        const [q1, q2] = await Promise.all([
            this.txHost1.withTransaction(() => this.calledService1.doWork(3)),
            this.txHost2.withTransaction(() => this.calledService2.doWork(4)),
        ]);
        return { q1, q2 };
    }

    @Transactional('named-connection')
    async namedTransactionWithinAnotherNamedTransaction() {
        const q1 = await this.calledService1.doWork(5);
        const q2 = await this.calledService2.doWork(6);
        const q3 = await this.nestedStartTransaction2(7);
        return { q1, q2, q3 };
    }
}

class MockDbConnection2 extends MockDbConnection {}
class MockDbConnection1 extends MockDbConnection {}

@Module({
    providers: [MockDbConnection1],
    exports: [MockDbConnection1],
})
class DbConnectionModule1 {}

@Module({
    providers: [MockDbConnection2],
    exports: [MockDbConnection2],
})
class DbConnectionModule2 {}

@Module({
    imports: [
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    connectionName: 'named-connection',
                    enableTransactionProxy: true,
                    imports: [DbConnectionModule1],
                    adapter: new TransactionAdapterMock({
                        connectionToken: MockDbConnection1,
                    }),
                }),
                new ClsPluginTransactional({
                    enableTransactionProxy: true,
                    imports: [DbConnectionModule2],
                    adapter: new TransactionAdapterMock({
                        connectionToken: MockDbConnection2,
                    }),
                }),
            ],
        }),
    ],
    providers: [CallingService, CalledService1, CalledService2],
})
class AppModule {}

describe('InjectTransaction with multiple named connections', () => {
    let module: TestingModule;
    let callingService: CallingService;
    let mockDbConnection1: MockDbConnection;
    let mockDbConnection2: MockDbConnection;
    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        callingService = module.get(CallingService);
        mockDbConnection1 = module.get(MockDbConnection1);
        mockDbConnection2 = module.get(MockDbConnection2);
    });

    describe('when using the @Transactional decorator', () => {
        it('should start two transactions independently with decorator', async () => {
            const result =
                await callingService.twoUnrelatedTransactionsWithDecorators();
            expect(result).toEqual({
                q1: { query: 'SELECT 1' },
                q2: { query: 'SELECT 2' },
            });
            const queries1 = mockDbConnection1.getClientsQueries();
            expect(queries1).toEqual([
                ['BEGIN TRANSACTION;', 'SELECT 1', 'COMMIT TRANSACTION;'],
            ]);
            const queries2 = mockDbConnection2.getClientsQueries();
            expect(queries2).toEqual([
                ['BEGIN TRANSACTION;', 'SELECT 2', 'COMMIT TRANSACTION;'],
            ]);
        });
        it('should start two transactions independently with startTransaction', async () => {
            const result =
                await callingService.twoUnrelatedTransactionsWithStartTransaction();
            expect(result).toEqual({
                q1: { query: 'SELECT 3' },
                q2: { query: 'SELECT 4' },
            });
            const queries1 = mockDbConnection1.getClientsQueries();
            expect(queries1).toEqual([
                ['BEGIN TRANSACTION;', 'SELECT 3', 'COMMIT TRANSACTION;'],
            ]);
            const queries2 = mockDbConnection2.getClientsQueries();
            expect(queries2).toEqual([
                ['BEGIN TRANSACTION;', 'SELECT 4', 'COMMIT TRANSACTION;'],
            ]);
        });
        it('ignore transactions for other named connection', async () => {
            const result =
                await callingService.namedTransactionWithinAnotherNamedTransaction();
            expect(result).toEqual({
                q1: { query: 'SELECT 5' },
                q2: { query: 'SELECT 6' },
                q3: { query: 'SELECT 7' },
            });
            const queries1 = mockDbConnection1.getClientsQueries();
            expect(queries1).toEqual([
                ['BEGIN TRANSACTION;', 'SELECT 5', 'COMMIT TRANSACTION;'],
            ]);
            const queries2 = mockDbConnection2.getClientsQueries();
            expect(queries2).toEqual([
                ['SELECT 6'],
                ['BEGIN TRANSACTION;', 'SELECT 7', 'COMMIT TRANSACTION;'],
            ]);
        });
    });
});

class TransactionAdapterMockWithoutTransactionProxySupport extends TransactionAdapterMock {
    supportsTransactionProxy = false;
}

describe('Using enableTransactionProxy when the adapter does not support it', () => {
    it('should throw an error', async () => {
        const modulePromise = () =>
            Test.createTestingModule({
                imports: [
                    ClsModule.forRoot({
                        plugins: [
                            new ClsPluginTransactional({
                                enableTransactionProxy: true,
                                adapter:
                                    new TransactionAdapterMockWithoutTransactionProxySupport(
                                        { connectionToken: MockDbConnection1 },
                                    ),
                            }),
                        ],
                    }),
                ],
            }).compile();
        expect(modulePromise).toThrow(TransactionProxyUnsupportedError);
    });
});
