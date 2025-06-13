import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional, Transactional, TransactionHost } from '../src';
import {
    MockDbConnection,
    TransactionAdapterMock,
} from './transaction-adapter-mock';

@Injectable()
class CalledService {
    constructor(
        private readonly txHost: TransactionHost<TransactionAdapterMock>,
    ) {}

    async doWork(num: number) {
        return this.txHost.tx.query(`SELECT ${num}`);
    }
}

@Injectable()
class CallingService {
    constructor(
        private readonly calledService: CalledService,
        private readonly txHost: TransactionHost<TransactionAdapterMock>,
    ) {}

    @Transactional<TransactionAdapterMock>({
        serializable: true,
    })
    async transactionalDecoratorWithDefaultOptions() {
        return await this.calledService.doWork(1);
    }

    @Transactional<TransactionAdapterMock>({
        serializable: true,
        sayHello: false,
    })
    async transactionalDecoratorWithCustomOptions() {
        return await this.calledService.doWork(2);
    }

    async withTransactionWithDefaultOptions() {
        return await this.txHost.withTransaction(
            { serializable: true },
            async () => this.calledService.doWork(3),
        );
    }

    async withTransactionWithCustomOptions() {
        return await this.txHost.withTransaction(
            { serializable: true, sayHello: false },
            async () => this.calledService.doWork(4),
        );
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
                    imports: [DbConnectionModule],
                    adapter: new TransactionAdapterMock({
                        connectionToken: MockDbConnection,
                        defaultTxOptions: { sayHello: true },
                    }),
                }),
            ],
        }),
    ],
    providers: [CallingService, CalledService],
})
class AppModule {}

describe('Using defaultOptions in Transactional adapter', () => {
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
        it('should merge passed options with default ones', async () => {
            const result =
                await callingService.transactionalDecoratorWithDefaultOptions();
            expect(result).toEqual({ query: 'SELECT 1' });
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                [
                    '/* Hello */ SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRANSACTION;',
                    'SELECT 1',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
        it('should override default options with explicit one', async () => {
            const result =
                await callingService.transactionalDecoratorWithCustomOptions();
            expect(result).toEqual({ query: 'SELECT 2' });
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                [
                    'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRANSACTION;',
                    'SELECT 2',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
    });

    describe('when using the withTransaction method', () => {
        it('should merge passed options with default ones', async () => {
            const result =
                await callingService.withTransactionWithDefaultOptions();
            expect(result).toEqual({ query: 'SELECT 3' });
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                [
                    '/* Hello */ SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRANSACTION;',
                    'SELECT 3',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
        it('should override default options with explicit one', async () => {
            const result =
                await callingService.withTransactionWithCustomOptions();
            expect(result).toEqual({ query: 'SELECT 4' });
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                [
                    'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRANSACTION;',
                    'SELECT 4',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
    });
});
