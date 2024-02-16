import { Inject } from '@nestjs/common';
const TRANSACTION_TOKEN = Symbol('TRANSACTION_TOKEN');

/**
 * Get injection token for the Transaction instance.
 * If name is omitted, the default instance is used.
 */
export function getTransactionToken(connectionName?: string) {
    return connectionName
        ? Symbol.for(`${TRANSACTION_TOKEN.description}_${connectionName}`)
        : TRANSACTION_TOKEN;
}

/**
 * Inject the Transaction instance directly (that is the `tx` property of the TransactionHost)
 *
 * Optionally, you can provide a connection name to inject a named instance.
 *
 * A shorthand for `Inject(getTransactionToken(connectionName))`
 */
export function InjectTransaction(connectionName?: string) {
    return Inject(getTransactionToken(connectionName));
}
