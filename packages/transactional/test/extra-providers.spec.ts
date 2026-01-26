import { ClsModule } from 'nestjs-cls';
import {
    ClsPluginTransactional,
    TransactionalAdapter,
    TransactionHost,
} from '../src';
import { Injectable, InjectionToken, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

const MOCK_TOKEN = 'MOCK_TOKEN';
// --- EXTRA SERVICE AND MODULE ---
@Injectable()
export class MyProviderService {
    private value: string = 'initial value';

    getValue() {
        return this.value;
    }
    setValue(newValue: string) {
        this.value = newValue;
    }
}

@Module({
    providers: [MyProviderService],
    exports: [MyProviderService],
})
export class MyProviderModule {}

// --- CUSTOM TRANSACTIONAL ADAPTER ---
interface CustomTransactionalAdapterOptions {
    txToken: any;
    defaultTxOptions?: any;
    extraProviderTokens?: InjectionToken<any>[];
}

export class MyCustomTransactionalAdapter implements TransactionalAdapter<
    any,
    any,
    any
> {
    connectionToken: any;
    defaultTxOptions?: any;
    extraProviderTokens?: InjectionToken<any>[];

    constructor(options: CustomTransactionalAdapterOptions) {
        this.connectionToken = options.txToken;
        this.defaultTxOptions = options.defaultTxOptions;
        this.extraProviderTokens = options.extraProviderTokens;
    }

    optionsFactory = (
        _connection: any,
        [extraProviders]: [MyProviderService] | any[],
    ) => ({
        wrapWithTransaction: async (
            _options: any,
            fn: (...args: any[]) => Promise<any>,
            _setTx: (tx?: any) => void,
        ) => {
            const result = await fn();
            extraProviders.setValue('after test');
            return result;
        },
        getFallbackInstance: () => null,
    });
}

// --- APPLICATION LOGIC (REPO & SERVICE) ---
@Injectable()
class CallingService {
    constructor(
        private readonly txHost: TransactionHost<MyCustomTransactionalAdapter>,
    ) {}

    async mockTransaction() {
        await this.txHost.withTransaction(async () => {});
    }
}

@Module({
    providers: [
        {
            provide: MOCK_TOKEN,
            useValue: 'MOCK_TOKEN',
        },
    ],
    exports: [MOCK_TOKEN],
})
export class MockModule {}

@Module({
    imports: [
        MockModule,
        MyProviderModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [MockModule, MyProviderModule],
                    adapter: new MyCustomTransactionalAdapter({
                        txToken: MOCK_TOKEN,
                        defaultTxOptions: {},
                        extraProviderTokens: [MyProviderService],
                    }),
                }),
            ],
        }),
    ],
    providers: [CallingService],
})
class AppModule {}

// --- TEST SUITE ---
describe('Custom Transactional Adapter With Custom Provider', () => {
    let module: TestingModule;
    let customProviderService: MyProviderService;
    let callingService: CallingService;
    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        customProviderService = module.get(MyProviderService);
        callingService = module.get(CallingService);
        customProviderService.setValue('before test');
    });

    it('should use the injected custom provider instance and return the updated value from the transaction method', async () => {
        await callingService.mockTransaction();
        expect(customProviderService.getValue()).toBe('after test');
    });
});
