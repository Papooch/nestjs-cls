export const TRANSACTION_CONNECTION = Symbol('TRANSACTION_CONNECTION');
export const TRANSACTIONAL_ADAPTER_OPTIONS = Symbol('TRANSACTIONAL_OPTIONS');

const TRANSACTIONAL_INSTANCE = Symbol('TRANSACTIONAL_CLIENT');

export const getTransactionalInstanceSymbol = (connectionName?: string) =>
    connectionName
        ? Symbol.for(`${TRANSACTIONAL_INSTANCE.toString()}_${connectionName}`)
        : TRANSACTIONAL_INSTANCE;
