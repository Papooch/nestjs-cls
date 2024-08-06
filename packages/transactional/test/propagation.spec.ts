import { Inject, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import {
    ClsPluginTransactional,
    Propagation,
    Transactional,
    TransactionAlreadyActiveError,
    TransactionHost,
    TransactionNotActiveError,
} from '../src';
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

    async doOtherWork(num: number) {
        return this.txHost.tx.query(`SELECT ${num}`);
    }
}

@Injectable()
class NestedTransactionsService {
    constructor(private readonly calledService: CalledService) {}

    @Transactional()
    async withDefaultPropagation(num: number) {
        return this.calledService.doWork(num);
    }

    @Transactional(Propagation.Required)
    async withRequiredPropagation(num: number) {
        return this.calledService.doWork(num);
    }

    @Transactional(Propagation.RequiresNew)
    async withRequiresNewPropagation(num: number) {
        return this.calledService.doWork(num);
    }

    @Transactional(Propagation.NotSupported)
    async withNotSupportedPropagation(num: number) {
        return this.calledService.doWork(num);
    }

    @Transactional(Propagation.Mandatory)
    async withMandatoryPropagation(num: number) {
        return this.calledService.doWork(num);
    }

    @Transactional(Propagation.Never)
    async withNeverPropagation(num: number) {
        return this.calledService.doWork(num);
    }
}

@Injectable()
class CallingServiceWithoutTransaction {
    @Inject(CalledService)
    protected readonly calledService!: CalledService;
    @Inject(TransactionHost)
    protected readonly txHost!: TransactionHost<TransactionAdapterMock>;
    @Inject(NestedTransactionsService)
    protected readonly nested!: NestedTransactionsService;

    async defaultPropagation() {
        await this.calledService.doWork(1);
        await this.nested.withDefaultPropagation(2);
    }

    async explicitRequiredPropagation() {
        await this.calledService.doWork(3);
        await this.nested.withRequiredPropagation(4);
    }

    async requiresNewPropagation() {
        await this.calledService.doWork(5);
        await this.nested.withRequiresNewPropagation(6);
    }

    async notSupportedPropagation() {
        await this.calledService.doWork(7);
        await this.nested.withNotSupportedPropagation(8);
    }
    async mandatoryPropagation() {
        await this.calledService.doWork(9);
        await this.nested.withMandatoryPropagation(10);
    }
    async neverPropagation() {
        await this.calledService.doWork(11);
        await this.nested.withNeverPropagation(12);
    }
}

@Injectable()
class CallingServiceWithTransaction extends CallingServiceWithoutTransaction {
    @Transactional()
    defaultPropagation(): Promise<void> {
        return super.defaultPropagation();
    }
    @Transactional()
    explicitRequiredPropagation(): Promise<void> {
        return super.explicitRequiredPropagation();
    }
    @Transactional()
    requiresNewPropagation(): Promise<void> {
        return super.requiresNewPropagation();
    }
    @Transactional()
    notSupportedPropagation(): Promise<void> {
        return super.notSupportedPropagation();
    }
    @Transactional()
    mandatoryPropagation(): Promise<void> {
        return super.mandatoryPropagation();
    }
    @Transactional()
    neverPropagation(): Promise<void> {
        return super.neverPropagation();
    }

    @Transactional<TransactionAdapterMock>(Propagation.NotSupported, {
        serializable: true,
    })
    async multipleNestedTransactions() {
        await this.calledService.doWork(10);
        await this.requiredPropagationWithOptions(11);
        await this.txHost.withTransaction(
            Propagation.RequiresNew,
            {
                serializable: true,
            },
            async () => {
                await this.nested.withRequiresNewPropagation(12);
                await this.defaultPropagationWithOptions(13);
                await this.calledService.doWork(14);
                await this.mandatoryPropagationWithOptions(15);
                throw new Error('Bad thing');
            },
        );
    }

    @Transactional<TransactionAdapterMock>(Propagation.Required, {
        serializable: true,
    })
    private async requiredPropagationWithOptions(num: number) {
        return this.nested.withRequiredPropagation(num);
    }

    @Transactional<TransactionAdapterMock>({
        serializable: true,
    })
    private async defaultPropagationWithOptions(num: number) {
        return this.nested.withRequiredPropagation(num);
    }

    @Transactional<TransactionAdapterMock>(Propagation.Mandatory, {
        serializable: true,
    })
    private async mandatoryPropagationWithOptions(num: number) {
        return this.nested.withRequiredPropagation(num);
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
                    }),
                }),
            ],
        }),
    ],
    providers: [
        CallingServiceWithoutTransaction,
        CallingServiceWithTransaction,
        NestedTransactionsService,
        CalledService,
    ],
})
class AppModule {}

const mockLogger = {
    ...console,
    warn: jest.fn(),
};

describe('Propagation', () => {
    let module: TestingModule;
    let withoutTx: CallingServiceWithoutTransaction;
    let withTx: CallingServiceWithTransaction;
    let mockDbConnection: MockDbConnection;
    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        module.useLogger(mockLogger);
        withoutTx = module.get(CallingServiceWithoutTransaction);
        withTx = module.get(CallingServiceWithTransaction);
        mockDbConnection = module.get(MockDbConnection);
    });

    describe('when run without an existing transaction', () => {
        it('should create a new transaction by default', async () => {
            await withoutTx.defaultPropagation();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                ['SELECT 1'],
                ['BEGIN TRANSACTION;', 'SELECT 2', 'COMMIT TRANSACTION;'],
            ]);
        });
        it('should create a new transaction in REQUIRED mode', async () => {
            await withoutTx.explicitRequiredPropagation();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                ['SELECT 3'],
                ['BEGIN TRANSACTION;', 'SELECT 4', 'COMMIT TRANSACTION;'],
            ]);
        });
        it('should create a new transaction in REQUIRES_NEW mode', async () => {
            await withoutTx.requiresNewPropagation();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                ['SELECT 5'],
                ['BEGIN TRANSACTION;', 'SELECT 6', 'COMMIT TRANSACTION;'],
            ]);
        });
        it('should not start a transaction in NOT_SUPPORTED mode', async () => {
            await withoutTx.notSupportedPropagation();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([['SELECT 7'], ['SELECT 8']]);
        });
        it('should throw a TransactionNotActiveError error in MANDATORY mode', async () => {
            await expect(withoutTx.mandatoryPropagation()).rejects.toThrow(
                TransactionNotActiveError,
            );
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([['SELECT 9']]);
        });
        it('should not start a transaction in NEVER mode', async () => {
            await withoutTx.neverPropagation();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([['SELECT 11'], ['SELECT 12']]);
        });
    });

    describe('when run in an existing transaction', () => {
        it('should re-use an existing transaction by default', async () => {
            await withTx.defaultPropagation();
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
        it('should re-use an existing transaction in REQUIRED mode', async () => {
            await withTx.explicitRequiredPropagation();
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
        it('should create a new transaction in REQUIRES_NEW mode', async () => {
            await withTx.requiresNewPropagation();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                ['BEGIN TRANSACTION;', 'SELECT 5', 'COMMIT TRANSACTION;'],
                ['BEGIN TRANSACTION;', 'SELECT 6', 'COMMIT TRANSACTION;'],
            ]);
        });
        it('should run the nested function without a transaction in NOT_SUPPORTED mode', async () => {
            await withTx.notSupportedPropagation();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                ['BEGIN TRANSACTION;', 'SELECT 7', 'COMMIT TRANSACTION;'],
                ['SELECT 8'],
            ]);
        });
        it('should re-use the existing transaction in MANDATORY mode', async () => {
            await withTx.mandatoryPropagation();
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                [
                    'BEGIN TRANSACTION;',
                    'SELECT 9',
                    'SELECT 10',
                    'COMMIT TRANSACTION;',
                ],
            ]);
        });
        it('should throw a TransactionAlreadyActiveError and rollback in NEVER mode', async () => {
            await expect(withTx.neverPropagation()).rejects.toThrow(
                TransactionAlreadyActiveError,
            );
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                ['BEGIN TRANSACTION;', 'SELECT 11', 'ROLLBACK TRANSACTION;'],
            ]);
        });
    });

    describe('when multiple nested transactions with different options are used', () => {
        it('should behave according to the settings', async () => {
            await expect(withTx.multipleNestedTransactions()).rejects.toThrow(
                'Bad thing',
            );
            const queries = mockDbConnection.getClientsQueries();
            expect(queries).toEqual([
                ['SELECT 10'],
                [
                    'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRANSACTION;',
                    'SELECT 11',
                    'COMMIT TRANSACTION;',
                ],
                [
                    'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRANSACTION;',
                    'SELECT 13',
                    'SELECT 14',
                    'SELECT 15',
                    'ROLLBACK TRANSACTION;',
                ],
                ['BEGIN TRANSACTION;', 'SELECT 12', 'COMMIT TRANSACTION;'],
            ]);
            expect(mockLogger.warn.mock.calls).toEqual([
                [
                    'Transaction options are ignored because the propagation mode is NOT_SUPPORTED (for method bound multipleNestedTransactions).',
                    'TransactionHost',
                ],
                [
                    'Transaction options are ignored because a transaction is already active and the propagation mode is REQUIRED (for method bound defaultPropagationWithOptions).',
                    'TransactionHost',
                ],
                [
                    'Transaction options are ignored because the propagation mode is MANDATORY (for method bound mandatoryPropagationWithOptions).',
                    'TransactionHost',
                ],
            ]);
        });
    });
});
