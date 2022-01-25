import { valueFromPath } from './value-from-path';

describe('valueFromPath', () => {
    const obj = { a: { b: { c: 4 } } };
    it('gets top level value from path', () => {
        expect(valueFromPath(obj, 'a')).toEqual({ b: { c: 4 } });
    });
    it('gets nested value from path', () => {
        expect(valueFromPath(obj, 'a.b.c')).toEqual(4);
    });
});
