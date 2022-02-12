import { Test, TestingModule } from '@nestjs/testing';
import { ClsServiceManager } from './cls-service-manager';
import { CLS_DEFAULT_NAMESPACE } from './cls.constants';
import { ClsStore } from './cls.interfaces';
import { ClsService } from './cls.service';

describe('ClsService', () => {
    let module: TestingModule;
    let service: ClsService;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                {
                    provide: ClsService,
                    useValue: ClsServiceManager.addClsService(
                        CLS_DEFAULT_NAMESPACE,
                    ),
                },
            ],
        }).compile();

        service = module.get<ClsService>(ClsService);
    });

    describe('happy path', () => {
        it('is defined', () => {
            expect(service).toBeDefined();
        });

        it('sets and retrieves the context', () => {
            service.run(() => {
                service.set('key', 123);
                expect(service.get()).toEqual({ key: 123 });
            });
        });
        it('sets and retrieves a single key from context', () => {
            service.run(() => {
                service.set('key', 123);
                expect(service.get('key')).toEqual(123);
            });
        });

        it('does not retireve context in a different call (run)', () => {
            service.run(() => {
                service.set('key', 123);
            });
            service.run(() => {
                expect(service.get('key')).not.toEqual(123);
            });
        });
        it('does not retireve context in a different call (enter)', () => {
            const runMe = (cb: () => void) => cb();
            runMe(() => {
                service.enter();
                service.set('key', 123);
            });
            runMe(() => {
                service.enter();
                expect(service.get('key')).not.toEqual(123);
            });
        });
    });

    describe('edge cases', () => {
        it('returns undefined on nonexistent key', () => {
            service.run(() => {
                const value = service.get('key');
                expect(value).toBeUndefined();
            });
        });

        it('throws error if trying to set a value without context', () => {
            expect(() => service.set('key', 123)).toThrowError();
        });
    });

    describe('nested values', () => {
        it('sets an object and gets a nested value', () => {
            service.run(() => {
                service.set('a', { b: 4 });
                expect(service.get('a.b')).toEqual(4);
            });
        });

        it('sets nested value and gets an object', () => {
            service.run(() => {
                service.set('a.b', 8);
                expect(service.get('a')).toEqual({ b: 8 });
            });
        });

        it('gets undefined for deep nested value that does not exist', () => {
            service.run(() => {
                expect(service.get('e.f.g.h')).toBeUndefined();
            });
        });
    });

    describe('typing', () => {
        interface IStore extends ClsStore {
            a: string;
            b: {
                c: number;
                d: {
                    e: boolean;
                };
            };
        }

        let typedService: ClsService<IStore>;

        beforeEach(() => {
            typedService = module.get<ClsService<IStore>>(ClsService);
        });

        it('enforces types', () => {
            typedService.get('a');
            typedService.get('b.c');
            typedService.get('b.d');
            typedService.get('b.d.e');

            //typedService.set()
        });
    });
});
