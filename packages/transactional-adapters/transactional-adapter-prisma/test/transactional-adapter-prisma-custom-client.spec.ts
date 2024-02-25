import {
    ClsPluginTransactional,
    InjectTransaction,
    Transaction,
    TransactionHost,
} from '@nestjs-cls/transactional';
import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { ClsModule } from 'nestjs-cls';
import { TransactionalAdapterPrisma } from '../src';

process.env.DATA_SOURCE_URL = 'file:../tmp/test-custom.db';

const prisma = new PrismaClient();
const customPrismaClient = prisma.$extends({
    model: {
        user: {
            async createWithEmail(name: string) {
                return await prisma.user.create({
                    data: { name: name, email: `${name}@email.com` },
                });
            },
            async getById(id: number) {
                return await prisma.user.findUnique({ where: { id } });
            },
        },
    },
});
type CustomPrismaClient = typeof customPrismaClient;
const CUSTOM_PRISMA_CLIENT = Symbol('CustomPrismaClient');

@Injectable()
class UserRepository {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<
            TransactionalAdapterPrisma<CustomPrismaClient>
        >,
        private readonly txHost: TransactionHost<
            TransactionalAdapterPrisma<CustomPrismaClient>
        >,
    ) {}

    async getUserById(id: number) {
        return this.txHost.tx.user.getById(id);
    }

    async createUser(name: string) {
        return this.tx.user.createWithEmail(name);
    }
}

@Module({
    providers: [
        { provide: CUSTOM_PRISMA_CLIENT, useValue: customPrismaClient },
    ],
    exports: [CUSTOM_PRISMA_CLIENT],
})
class PrismaModule {}

@Module({
    imports: [
        PrismaModule,
        ClsModule.forRoot({
            plugins: [
                new ClsPluginTransactional({
                    imports: [PrismaModule],
                    adapter: new TransactionalAdapterPrisma({
                        prismaInjectionToken: CUSTOM_PRISMA_CLIENT,
                    }),
                    enableTransactionProxy: true,
                }),
            ],
        }),
    ],
    providers: [UserRepository],
})
class AppModule {}

describe('Transactional', () => {
    let module: TestingModule;
    let repository: UserRepository;
    let txHost: TransactionHost<TransactionalAdapterPrisma<CustomPrismaClient>>;

    beforeAll(async () => {
        execSync('yarn prisma migrate reset --force', { env: process.env });
    });

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        await module.init();
        repository = module.get(UserRepository);
        txHost = module.get(TransactionHost);
    });

    describe('TransactionalAdapterPrisma - Custom client', () => {
        it('should work with custom prisma client', async () => {
            await txHost.withTransaction(async () => {
                const { id } = await repository.createUser('Carlos');
                const user = await repository.getUserById(id);
                expect(user).toEqual({
                    id,
                    name: 'Carlos',
                    email: 'Carlos@email.com',
                });
            });
        });
    });
});
