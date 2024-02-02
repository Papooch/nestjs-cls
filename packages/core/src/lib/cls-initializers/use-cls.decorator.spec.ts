import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CLS_ID } from '../cls.constants';
import { ClsModule } from '../cls.module';
import { ClsService } from '../cls.service';
import { UseCls } from './use-cls.decorator';
import { ClsServiceManager } from '../cls-service-manager';

@Injectable()
class TestClass {
    constructor(private readonly cls: ClsService) {}

    @UseCls()
    async startContext(value: string) {
        this.cls.set(CLS_ID, this.generateId());
        this.cls.set('value', value);
        return this.useContextVariables();
    }

    @UseCls<[string]>({
        generateId: true,
        idGenerator: function (this: TestClass) {
            return this.generateId();
        },
        setup: (cls, value: string) => {
            cls.set('value', value);
        },
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async startContextWithIdAndSetup(value: string) {
        return this.useContextVariables();
    }

    private generateId() {
        return 'the-id';
    }

    private useContextVariables() {
        return {
            id: this.cls.getId(),
            value: this.cls.get('value'),
            inheritedValue: this.cls.get('inheritedValue'),
        };
    }
}

describe('@UseCls', () => {
    let testClass: TestClass;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [ClsModule],
            providers: [TestClass],
        }).compile();

        testClass = module.get(TestClass);
    });

    it('wraps function with context', async () => {
        const result = await testClass.startContext('something');
        expect(result).toEqual({
            id: 'the-id',
            value: 'something',
        });
    });

    it('should handle nested context', async () => {
        const cls = ClsServiceManager.getClsService();
        await cls.run(async () => {
            cls.set('inheritedValue', 'other');
            const result = await testClass.startContext('something');
            expect(result).toEqual({
                id: 'the-id',
                value: 'something',
                inheritedValue: 'other',
            });
        });
    });

    it('calls id generator and setup and uses correct this', async () => {
        const result = await testClass.startContextWithIdAndSetup(
            'something else',
        );
        expect(result).toEqual({
            id: 'the-id',
            value: 'something else',
        });
    });
});
