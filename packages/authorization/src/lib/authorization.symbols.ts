export const AUTH_HOST_OPTIONS = Symbol('AUTH_HOST_OPTIONS');

const AUTH_CLS_KEY = Symbol('AUTH_CLS_KEY');

export const getAuthClsKey = (authName?: string) =>
    authName
        ? Symbol.for(`${AUTH_CLS_KEY.description}_${authName}`)
        : AUTH_CLS_KEY;
