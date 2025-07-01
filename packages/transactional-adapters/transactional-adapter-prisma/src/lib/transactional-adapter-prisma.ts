import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { getSavepointStatements, SQLFlavor } from './savepoint-syntax';

interface AnyTransactionClient {
    $transaction: (fn: (client: any) => Promise<any>, options?: any) => any;
}

export type PrismaTransactionalClient<
    TClient extends AnyTransactionClient = PrismaClient,
> = Parameters<Parameters<TClient['$transaction']>[0]>[0];

export type PrismaTransactionOptions<
    TClient extends AnyTransactionClient = PrismaClient,
> = Parameters<TClient['$transaction']>[1];

export interface PrismaTransactionalAdapterOptions<
    TClient extends AnyTransactionClient = PrismaClient,
> {
    /**
     * The injection token for the PrismaClient instance.
     */
    prismaInjectionToken: any;

    /**
     * Default options for the transaction. These will be merged with any transaction-specific options
     * passed to the `@Transactional` decorator or the `TransactionHost#withTransaction` method.
     */
    defaultTxOptions?: Partial<PrismaTransactionOptions<TClient>>;

    /**
     * Specify the SQL flavor used by the database (does not apply to NoSQL databases).
     *
     * This is used to determine the syntax for savepoints in nested transactions, because
     * the PrismaClient does not provide a way to determine the SQL flavor automatically.
     *
     * If not provided, the adapter will not support nested transactions.
     */
    sqlFlavor?: SQLFlavor;
}

export class TransactionalAdapterPrisma<
    TClient extends AnyTransactionClient = PrismaClient,
> implements
        TransactionalAdapter<
            TClient,
            PrismaTransactionalClient<TClient>,
            PrismaTransactionOptions<TClient>
        >
{
    connectionToken: any;

    defaultTxOptions?: Partial<PrismaTransactionOptions<TClient>>;

    sqlFlavor?: SQLFlavor;

    constructor(options: PrismaTransactionalAdapterOptions<TClient>) {
        this.connectionToken = options.prismaInjectionToken;
        this.defaultTxOptions = options.defaultTxOptions;
        this.sqlFlavor = options.sqlFlavor;
    }

    optionsFactory = (prisma: TClient) => ({
        wrapWithTransaction: async (
            options: PrismaTransactionOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: PrismaTransactionalClient<TClient>) => void,
        ) => {
            return await prisma.$transaction(async (p) => {
                setClient(p);
                return fn();
            }, options);
        },
        wrapWithNestedTransaction: this.sqlFlavor
            ? this.wrapWithNestedTransaction
            : undefined,
        getFallbackInstance: () => prisma,
    });

    private readonly wrapWithNestedTransaction = async (
        _options: PrismaTransactionOptions,
        fn: (...args: any[]) => Promise<any>,
        setClient: (client?: PrismaTransactionalClient<TClient>) => void,
        tx: any, // use `any` to please TypeScript (or figure out a better type)
    ) => {
        const client = tx as PrismaClient;
        const savepointId = `savepoint_${randomUUID().replace(/-/g, '_')}`;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const statements = getSavepointStatements(this.sqlFlavor!, savepointId);
        setClient(client);
        try {
            await client.$executeRawUnsafe(statements.save);

            const result = await fn();
            statements.release &&
                (await client.$executeRawUnsafe(statements.release));
            return result;
        } catch (e) {
            await client.$executeRawUnsafe(statements.rollback);
            throw e;
        }
    };
}
