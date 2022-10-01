import {
    Controller,
    Get,
    INestApplication,
    Inject,
    Injectable,
    Module,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ClsModule, ClsService, InjectableProxy } from '../../src';

@Injectable()
class InjectedClass {
    property = 'injected prop';
}

@InjectableProxy()
class RequestScopedClass {
    id: string;
    requestScopedValue: string;

    constructor(
        private readonly cls: ClsService,
        private readonly injected: InjectedClass,
    ) {
        this.id = this.cls.getId();
    }

    getProperty() {
        return this.injected.property;
    }
}

const FACTORY_PROVIDER = 'FACTORY_PROVIDER';
function requestScopedFactory(injected: InjectedClass, cls: ClsService) {
    return {
        id: cls.getId(),
        getInjected: () => injected.property,
    };
}

function randomString() {
    return Math.random().toString(36).slice(-10);
}

@Controller()
class TestController {
    constructor(
        private readonly rsc: RequestScopedClass,
        @Inject(FACTORY_PROVIDER)
        private readonly rsf: Awaited<ReturnType<typeof requestScopedFactory>>,
    ) {}

    @Get('/hello')
    async getHello() {
        this.rsc.requestScopedValue = randomString();
        const beforeWait = {
            rscId: this.rsc.id,
            rsfId: this.rsf.id,
        };
        await new Promise((ok) => setTimeout(ok, Math.random() * 1000));
        const afterWait = {
            rscId: this.rsc.id,
            rsfId: this.rsf.id,
        };

        return {
            beforeWait,
            afterWait,
        };
    }
}

@Module({
    providers: [InjectedClass],
    exports: [InjectedClass],
})
class ImportedModule {}

@Module({
    imports: [
        ClsModule.forRoot({
            middleware: { mount: true, generateId: true },
        }),
        ClsModule.forFeatureAsync({
            imports: [ImportedModule],
            useClass: RequestScopedClass,
        }),
        ClsModule.forFeatureAsync({
            provide: FACTORY_PROVIDER,
            imports: [ImportedModule],
            inject: [InjectedClass, ClsService],
            useFactory: requestScopedFactory,
        }),
    ],
    controllers: [TestController],
})
export class TestModule {}

describe('Proxy providers', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
});
