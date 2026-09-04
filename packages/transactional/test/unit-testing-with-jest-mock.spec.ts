import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

// Load the real module first — `jest.requireActual` only works for CommonJS,
// so this is how a partial mock keeps the rest of the module's exports.
const actual = await import('@nestjs-cls/transactional');

jest.unstable_mockModule('@nestjs-cls/transactional', () => ({
    // Keep everything else from the original module
    ...actual,
    // But override the Transactional decorator with a no-op
    Transactional: () => jest.fn(),
}));

const { TransactionHost } = actual;
// The module under test has to be imported *after* the mock is registered.
const { UnitTestableRepository, UnitTestableService } =
    await import('./unit-testable/unit-testable.service');

describe('Transactional unit testing with jest.mock', () => {
    let service: InstanceType<typeof UnitTestableService>;

    // Create a mock for the TransactionHost
    const transactionalHostMock = {
        tx: { query: jest.fn<(sql: string) => Promise<string>>() },
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
