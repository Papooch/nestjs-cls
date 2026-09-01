import { jest } from '@jest/globals';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionHost } from '../src';
import { TransactionAdapterMock } from './transaction-adapter-mock';

/**
 * A no-op method decorator that can be used in place of @Transactional()
 * to skip transaction management in unit tests.
 *
 * This demonstrates one ESM-compatible approach to unit-testing services
 * that use @Transactional() without any CLS/transaction infrastructure.
 */
function NoOpTransactional(): MethodDecorator {
    return (_target, _key, descriptor) => descriptor;
}

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

    @NoOpTransactional()
    async decoratedServiceMethod() {
        const result = await this.repo.repositoryMethod();
        return result;
    }
}

describe('Transactional unit testing with jest.mock', () => {
    let service: UnitTestableService;

    // Create a mock for the TransactionHost
    const transactionalHostMock = {
        tx: { query: jest.fn<any>() },
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
