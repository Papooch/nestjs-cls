export const TRANSACTION_CONNECTION = Symbol('TRANSACTION_CONNECTION');
export const TRANSACTIONAL_ADAPTER_OPTIONS = Symbol('TRANSACTIONAL_OPTIONS');

const TRANSACTION_CLS_KEY = Symbol('TRANSACTION_CLS_KEY');

export const getTransactionClsKey = (connectionName?: string) =>
    connectionName
        ? Symbol.for(`${TRANSACTION_CLS_KEY.description}_${connectionName}`)
        : TRANSACTION_CLS_KEY;
