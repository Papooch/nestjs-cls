import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClsModule } from '@gring2/nestjs-cls';
import { ClsPluginTransactional } from '../src';
import {
    MockDbConnection,
    TransactionAdapterMock,
} from './transaction-adapter-mock';

class TransactionalAdapterMockWithHooks extends TransactionAdapterMock {
    initCalled = false;
    destroyCalled = false;
    bootstrapCalled = false;
    beforeShutdownCalled = false;
    shutdownCalled = false;

    onModuleInit() {
        this.initCalled = true;
    }

    onModuleDestroy() {
        this.destroyCalled = true;
    }

    onApplicationBootstrap() {
        this.bootstrapCalled = true;
    }

    beforeApplicationShutdown() {
        this.beforeShutdownCalled = true;
    }

    onApplicationShutdown() {
        this.shutdownCalled = true;
    }
}

describe('Lifecycle hooks', () => {
    it('should trigger all lifecycle hooks defined in the TransactionalAdapter', async () => {
        @Module({
            providers: [MockDbConnection],
            exports: [MockDbConnection],
        })
        class DbConnectionModule {}

        const adapter = new TransactionalAdapterMockWithHooks({
            connectionToken: MockDbConnection,
        });

        @Module({
            imports: [
                ClsModule.forRoot({
                    plugins: [
                        new ClsPluginTransactional({
                            imports: [DbConnectionModule],
                            adapter: adapter,
                        }),
                    ],
                }),
            ],
        })
        class AppModule {}

        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        expect(adapter.bootstrapCalled).toBe(false);
        expect(adapter.initCalled).toBe(false);

        await module.init();

        expect(adapter.bootstrapCalled).toBe(true);
        expect(adapter.initCalled).toBe(true);
        expect(adapter.beforeShutdownCalled).toBe(false);
        expect(adapter.shutdownCalled).toBe(false);
        expect(adapter.destroyCalled).toBe(false);

        await module.close();

        expect(adapter.beforeShutdownCalled).toBe(true);
        expect(adapter.shutdownCalled).toBe(true);
        expect(adapter.destroyCalled).toBe(true);
    });
});
