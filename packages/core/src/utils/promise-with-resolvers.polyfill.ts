export type PromiseWithResolvers = {
    resolve: (value?: any) => void;
    reject: (error: any) => void;
    promise: Promise<any>;
};

/**
 * Simulates the behavior of Promise.withResolvers
 * that is available in Node 22
 *
 * FUTURE: Remove this polyfill once we target Node 22
 */
export function Promise_withResolvers<T>(): PromiseWithResolvers {
    let resolve: any;
    let reject: any;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { promise, resolve: resolve!, reject: reject! };
}
