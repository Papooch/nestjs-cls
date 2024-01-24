/**
 * Sets the propagation mode for a transaction.
 */
export enum Propagation {
    /**
     * (default) Reuse the existing transaction or create a new one if none exists.
     */
    Required = 'REQUIRED',
    /**
     * Create a new transaction even if one already exists.
     */
    RequiresNew = 'REQUIRES_NEW',
    /**
     * Run without a transaction even if one exists.
     */
    NotSupported = 'NOT_SUPPORTED',
    /**
     * Reuse an existing transaction, throw an exception otherwise
     */
    Mandatory = 'MANDATORY',
    /**
     * Throw an exception if an existing transaction exists, otherwise create a new one
     */
    Never = 'NEVER',
}

/**
 * Base error for transaction propagation errors.
 */
export class TransactionPropagationError extends Error {
    name = TransactionPropagationError.name;
}

/**
 * Error thrown when a attempting to start a transaction in mode NEVER, but an existing transaction is already active.
 */
export class TransactionAlreadyActiveError extends TransactionPropagationError {
    name = TransactionAlreadyActiveError.name;
    constructor(methodName: string) {
        super(
            `Trying to start a transaction in mode ${Propagation.Never}, but an existing transaction is already active (for method ${methodName}).`,
        );
    }
}

/**
 * Error thrown when a attempting to start a transaction in mode MANDATORY, but no existing transaction is active.
 */
export class TransactionNotActiveError extends TransactionPropagationError {
    name = TransactionNotActiveError.name;
    constructor(methodName?: string) {
        super(
            `Trying to start a transaction in mode ${Propagation.Mandatory}, but no existing transaction is active (for method ${methodName}).`,
        );
    }
}
