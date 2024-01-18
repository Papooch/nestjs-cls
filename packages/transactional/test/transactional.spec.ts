import { Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ClsModule, UseCls } from 'nestjs-cls';
import {
    MockDbClient,
    MockDbConnection,
    MockTransactionAdapter,
} from './mockDbAdapter';

import { ClsPluginTransactional } from '../src/lib/plugin-transactional';
import { TransactionHost } from '../src/lib/transaction-host';
import { Transactional } from '../src/lib/transactional.decorator';

@Injectable()
class CalledService {
    constructor(
        private readonly txHost: TransactionHost<MockTransactionAdapter>,
    ) {
        console.log(this);
    }

    async doWork() {
        this.txHost.client.query('SELECT 1');
    }

    async doOtherWork() {
        this.txHost.client.query('SELECT 2');
    }

    getPerformedOperations() {
        return this.txHost.client.operations;
    }
}

@Injectable()
class CallingService {
    constructor(
        private readonly calledService: CalledService,
        private readonly txHost: TransactionHost<MockTransactionAdapter>,
    ) {}

    @Transactional()
    async startTransaction() {
        await this.calledService.doWork();
        await this.calledService.doOtherWork();
        console.log(this.calledService.getPerformedOperations());
    }

    @UseCls({
        generateId: true,
        resolveProxyProviders: true,
    })
    async startTransactionImperative() {
        await this.txHost.startTransaction({}, async () => {
            await this.calledService.doWork();
            await this.calledService.doOtherWork();
            console.log(this.calledService.getPerformedOperations());
        });
        await this.calledService.doWork();
        await this.calledService.doOtherWork();
        console.log(this.calledService.getPerformedOperations());
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
                    adapter: new MockTransactionAdapter({
                        connectionToken: MockDbConnection,
                    }),
                }),
            ],
        }),
    ],
    providers: [CallingService, CalledService],
})
class AppModule {}

describe('Transactional', () => {
    it('should bootstrap', async () => {
        const app = await NestFactory.create(AppModule);
        await app.init();
        console.log(app.get(CalledService));
        await app.get(CallingService).startTransactionImperative();
        console.log('------');
        await app.get(CallingService).startTransaction();
        expect(app).toBeDefined();
    });
});
