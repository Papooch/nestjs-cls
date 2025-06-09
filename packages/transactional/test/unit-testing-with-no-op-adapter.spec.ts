import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ClsPluginTransactional,
    NoOpTransactionalAdapter,
    Transactional,
    TransactionHost,
} from '../src';
import { TransactionAdapterMock } from './transaction-adapter-mock';
import { ClsModule } from '@gring2/nestjs-cls';

@Injectable()
class UnitTestableRepository {
    constructor(
        private readonly txHost: TransactionHost<TransactionAdapterMock>,
    ) {}

    async repositoryMethod() {
        return this.txHost.tx.query('CREATE ENTITY');
    }
}

@Injectable()
class UnitTestableService {
    constructor(private readonly repo: UnitTestableRepository) {}

    @Transactional()
    async decoratedServiceMethod() {
        const result = await this.repo.repositoryMethod();
        return result;
    }
}

describe('Transactional unit testing with no-op adapter', () => {
    // Create a mock for the TransactionHost
    const clientMock = {
        query: jest.fn(),
    };
    clientMock.query.mockResolvedValue('MOCKED QUERY');

    it("should work while passing 'tx' instance", async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ClsModule.registerPlugins([
                    new ClsPluginTransactional({
                        adapter: new NoOpTransactionalAdapter({
                            tx: clientMock,
                        }),
                    }),
                ]),
            ],
            providers: [UnitTestableRepository, UnitTestableService],
        }).compile();

        const service = module.get(UnitTestableService);

        const result = await service.decoratedServiceMethod();
        expect(result).toBe('MOCKED QUERY');
    });

    it("should work while providing 'tx' via token", async () => {
        @Module({
            providers: [
                {
                    provide: 'DB_CLIENT',
                    useValue: clientMock,
                },
            ],
            exports: ['DB_CLIENT'],
        })
        class MocksModule {}

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ClsModule.registerPlugins([
                    new ClsPluginTransactional({
                        imports: [MocksModule],
                        adapter: new NoOpTransactionalAdapter({
                            txToken: 'DB_CLIENT',
                        }),
                    }),
                ]),
            ],
            providers: [UnitTestableRepository, UnitTestableService],
        }).compile();

        const service = module.get(UnitTestableService);

        const result = await service.decoratedServiceMethod();
        expect(result).toBe('MOCKED QUERY');
    });
});
