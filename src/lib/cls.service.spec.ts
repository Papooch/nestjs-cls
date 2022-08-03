import { Test, TestingModule } from '@nestjs/testing';
import { Terminal } from '../types/recursive-key-of.type';
import { ClsServiceManager } from './cls-service-manager';
import { CLS_DEFAULT_NAMESPACE, CLS_ID } from './cls.constants';
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

    describe('store access', () => {
        it('retrieves the whole store', () => {
            service.run(() => {
                service.set('a', 1);
                service.set('b', 2);
                service.set('c', 3);

                expect(service.get()).toEqual({
                    a: 1,
                    b: 2,
                    c: 3,
                });
            });
        });

        it('sets and retrieves symbol key from context', () => {
            const sym = Symbol('sym');
            service.run(() => {
                service.set(sym, 123);
                expect(service.get(sym)).toEqual(123);
            });
        });
        it('sets CLS_ID and retrieves it with getId', () => {
            service.run(() => {
                service.set(CLS_ID, 123);
                expect(service.getId()).toEqual(123);
            });
        });
    });

    describe('key presence', () => {
        it('checks key presence (string key)', () => {
            service.run(() => {
                service.set('a', 1);
                expect(service.has('a')).toEqual(true);
            });
        });
        it('checks key absence (string key)', () => {
            service.run(() => {
                expect(service.has('b')).toEqual(false);
            });
        });
        it('checks key presence (symbol key)', () => {
            const sym = Symbol('sym');
            service.run(() => {
                service.set(sym, 123);
                expect(service.has(sym)).toEqual(true);
            });
        });
        it('checks key absence (symbol key)', () => {
            const sym = Symbol('sym');
            service.run(() => {
                expect(service.has(sym)).toEqual(false);
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
                    f: Array<string>;
                };
                g: Map<string, number>;
                h: Terminal<{
                    i: string;
                    j: number;
                }>;
            };
        }

        let typedService: ClsService<IStore>;

        beforeEach(() => {
            typedService = module.get<ClsService<IStore>>(ClsService);
        });

        it('enforces types', () => {
            typedService.run(() => {
                typedService.set('a', '1');
                typedService.set('b.c', 1);
                typedService.set('b.d.e', false);
                typedService.set('b.d.f', ['x']);
                typedService.set('b.g', new Map());
                typedService.set('b.h', { i: 'i', j: 1 });

                const { a, b } = typedService.get();
                a;
                b;

                typedService.get('a');
                typedService.get('b.c');
                typedService.get('b.d');
                typedService.get('b.d.e');
                typedService.get('b.d.f')[0];
                typedService.get('b.g').get('x');
                const { i, j } = typedService.get('b.h');
                i;
                j;
            });
        });
    });
});
