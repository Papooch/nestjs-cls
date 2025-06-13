import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import {
    ClsPluginTransactional,
    InjectTransactionHost,
    Propagation,
    Transactional,
    TransactionHost,
} from '../src';
import {
    MockDbConnection,
    TransactionAdapterMock,
} from './transaction-adapter-mock';

class CalledService {
    constructor(
        private readonly txHost: TransactionHost<TransactionAdapterMock>,
    ) {}

    async doWork(num: number) {
        return this.txHost.tx.query(`SELECT ${num}`);
    }
}

@Injectable()
class CalledService1 extends CalledService {
    constructor(
        @InjectTransactionHost('test1')
        txHost: TransactionHost<TransactionAdapterMock>,
    ) {
        super(txHost);
    }
}

@Injectable()
class CalledService2 extends CalledService {
    constructor(
        @InjectTransactionHost('test2')
        txHost: TransactionHost<TransactionAdapterMock>,
    ) {
        super(txHost);
    }
}

@Injectable()
class CallingService {
    constructor(
        private readonly calledService1: CalledService1,
        private readonly calledService2: CalledService2,
        @InjectTransactionHost('test1')
        private readonly txHost1: TransactionHost<TransactionAdapterMock>,
        @InjectTransactionHost('test2')
        private readonly txHost2: TransactionHost<TransactionAdapterMock>,
    ) {}

    async twoUnrelatedTransactionsWithDecorators() {
        const [q1, q2] = await Promise.all([
            this.nestedStartTransaction1(1),
            this.nestedStartTransaction2(2),
        ]);
        return { q1, q2 };
    }

    @Transactional('test1')
    private async nestedStartTransaction1(num: number) {
        return this.calledService1.doWork(num);
    }

    @Transactional('test2')
    private async nestedStartTransaction2(num: number) {
        return this.calledService2.doWork(num);
    }
    @Transactional('test2', Propagation.Required)
    async namedTransactionPropagationRequired(num: number) {
        return this.namedTransactionPropagationRequiresNew(num);
    }

    @Transactional('test2', Propagation.RequiresNew)
    private async namedTransactionPropagationRequiresNew(num: number) {
        return this.calledService2.doWork(num);
    }

    async twoUnrelatedTransactionsWithStartTransaction() {
        const [q1, q2] = await Promise.all([
            this.txHost1.withTransaction(() => this.calledService1.doWork(3)),
            this.txHost2.withTransaction(() => this.calledService2.doWork(4)),
        ]);
        return { q1, q2 };
    }

    @Transactional('test1')
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
                    connectionName: 'test1',
                    imports: [DbConnectionModule1],
                    adapter: new TransactionAdapterMock({
                        connectionToken: MockDbConnection1,
                    }),
                }),
                new ClsPluginTransactional({
                    connectionName: 'test2',
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

describe('Transactional - multiple connections', () => {
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

        it('should start new transactions for RequiresNew Propagation', async () => {
            await callingService.namedTransactionPropagationRequired(1);

            const queries = mockDbConnection2.getClientsQueries();
            expect(queries).toEqual([
                ['BEGIN TRANSACTION;', 'COMMIT TRANSACTION;'],
                ['BEGIN TRANSACTION;', 'SELECT 1', 'COMMIT TRANSACTION;'],
            ]);
        });
    });
});
