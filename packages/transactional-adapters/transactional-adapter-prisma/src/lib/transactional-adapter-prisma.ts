import { TransactionalAdapter } from '@nestjs-cls/transactional';
import { PrismaClient } from '@prisma/client';

export type PrismaTransactionalClient = Parameters<
    Parameters<PrismaClient['$transaction']>[0]
>[0];

export type PrismaTransactionOptions = Parameters<
    PrismaClient['$transaction']
>[1];

export interface PrismaTransactionalAdapterOptions {
    /**
     * The injection token for the PrismaClient instance.
     */
    prismaInjectionToken: any;
}

export class TransactionalAdapterPrisma
    implements
        TransactionalAdapter<
            PrismaClient,
            PrismaTransactionalClient,
            PrismaTransactionOptions
        >
{
    connectionToken: any;

    constructor(options: { prismaInjectionToken: any }) {
        this.connectionToken = options.prismaInjectionToken;
    }

    optionsFactory = (prisma: PrismaClient) => ({
        wrapWithTransaction: async (
            options: PrismaTransactionOptions,
            fn: (...args: any[]) => Promise<any>,
            setClient: (client?: PrismaTransactionalClient) => void,
        ) => {
            return await prisma.$transaction(async (p) => {
                setClient(p);
                return fn();
            }, options);
        },
        getFallbackInstance: () => prisma,
    });
}
