import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from '@gring2/nestjs-cls';
import { ClsPluginTransactional, Transactional, TransactionHost } from '../src';
import {
    MockDbConnection,
    TransactionAdapterMock,
} from './transaction-adapter-mock';

export function MetadataDefiningDecorator(): MethodDecorator {
    return (
        _target: any,
        _propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
    ) => {
        Reflect.defineMetadata('testproperty', 'testvalue', descriptor.value);
        return descriptor;
    };
}

export function PropertyDefiningDecorator(): MethodDecorator {
    return (
        _target: any,
        _propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
    ) => {
        descriptor.value.testproperty = 'testvalue';
        return descriptor;
    };
}

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
class CallingService {
    constructor(private readonly calledService: CalledService) {}

    @Transactional<TransactionAdapterMock>({ serializable: true })
    @MetadataDefiningDecorator()
    @PropertyDefiningDecorator()
    async transactionWithDecoratorWithOptions() {
        await this.calledService.doWork(1);
        await this.calledService.doOtherWork(2);
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
    providers: [CallingService, CalledService],
})
class AppModule {}

describe('Transactional with other decorators', () => {
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

    describe('when using the @Transactional decorator with other decorators', () => {
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
    });
    describe('should mantain method properties set by other decorators', () => {
        it('should mantain metadata', () => {
            expect(
                Reflect.getMetadata(
                    'testproperty',
                    callingService.transactionWithDecoratorWithOptions,
                ),
            ).toEqual('testvalue');
        });

        it('should mantain property', () => {
            expect(
                callingService.transactionWithDecoratorWithOptions[
                    'testproperty'
                ],
            ).toEqual('testvalue');
        });
    });
});
