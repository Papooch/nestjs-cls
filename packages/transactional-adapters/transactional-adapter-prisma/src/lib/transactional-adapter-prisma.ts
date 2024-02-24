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

export interface PrismaTransactionalAdapterOptions {
    /**
     * The injection token for the PrismaClient instance.
     */
    prismaInjectionToken: any;
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

    constructor(options: { prismaInjectionToken: any }) {
        this.connectionToken = options.prismaInjectionToken;
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
