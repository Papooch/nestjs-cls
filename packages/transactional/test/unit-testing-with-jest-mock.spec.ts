import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Transactional, TransactionHost } from '../src';
import { TransactionAdapterMock } from './transaction-adapter-mock';

jest.mock('../src', () => ({
    ...jest.requireActual('@nestjs-cls/transactional'),
    // Override the Transactional decorator with a no-op
    Transactional: () => jest.fn(),
}));

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

describe('Transactional unit testing with jest.mock', () => {
    let service: UnitTestableService;

    // Create a mock for the TransactionHost
    const transactionalHostMock = {
        tx: { query: jest.fn() },
    };

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UnitTestableRepository,
                UnitTestableService,
                {
                    // Provide the mock of the TransactionHost
                    provide: TransactionHost,
                    useValue: transactionalHostMock,
                },
            ],
        }).compile();

        service = module.get(UnitTestableService);
    });

    it('should should properly mock TransactionHost', async () => {
        transactionalHostMock.tx.query.mockResolvedValue('MOCKED QUERY');
        const result = await service.decoratedServiceMethod();
        expect(result).toBe('MOCKED QUERY');
    });
});
