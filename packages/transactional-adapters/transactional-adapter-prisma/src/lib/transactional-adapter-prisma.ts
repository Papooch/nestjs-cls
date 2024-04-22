import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { PrismaClient } from '@prisma/client';

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

    constructor(options: PrismaTransactionalAdapterOptions<TClient>) {
        this.connectionToken = options.prismaInjectionToken;
        this.defaultTxOptions = options.defaultTxOptions;
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
        getFallbackInstance: () => prisma,
    });
}
