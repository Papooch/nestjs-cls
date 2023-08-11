import { getValueFromPath, setValueFromPath } from './value-from-path';

describe('getValueFromPath', () => {
    const obj = { a: { b: { c: 4 } } };
    it('gets top level value from path', () => {
        expect(getValueFromPath(obj, 'a')).toEqual({ b: { c: 4 } });
    });
    it('gets nested value from path', () => {
        expect(getValueFromPath(obj, 'a.b.c')).toEqual(4);
    });
    it('gets undefined for value that does not exist', () => {
        expect(getValueFromPath(obj, 'a.b.c.d' as any)).toBeUndefined;
    });
});
describe('setValueFromPath', () => {
    const expected = { a: { b: { c: 4 } } };
    it('sets top level value from path', () => {
        const obj = {} as typeof expected;
        expect(setValueFromPath(obj, 'a', { b: { c: 4 } })).toEqual(expected);
    });
    it('gets nested value from path', () => {
        const obj = {} as typeof expected;
        expect(setValueFromPath(obj, 'a.b.c', 4)).toEqual(expected);
    });
    it("doesn't overwrite existing values if nested value is set", () => {
        const expected2 = expected as any;
        expected2.a.d = 8;
        const obj = {} as typeof expected;
        setValueFromPath(obj, 'a.b.c', 4);
        setValueFromPath(obj, 'a.d' as any, 8);
        expect(obj).toEqual(expected2);
    });
});
