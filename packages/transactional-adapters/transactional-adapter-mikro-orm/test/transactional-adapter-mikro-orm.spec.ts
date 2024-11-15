import {
  ClsPluginTransactional,
  InjectTransaction,
  Transaction,
  Transactional,
  TransactionHost,
} from '@nestjs-cls/transactional';
import { Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule, UseCls } from 'nestjs-cls';
import { execSync } from 'node:child_process';
import { MikroORM, Entity, PrimaryKey, Property, IsolationLevel } from '@mikro-orm/core';
import { TransactionalAdapterMikroOrm } from '../src';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name?: string;

  @Property()
  email?: string;
}

const mikroOrm = MikroORM.init<PostgreSqlDriver>({
  dbName: 'postgres',
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5446,
  entities: [User],
  driver: PostgreSqlDriver,
  allowGlobalContext: true,
});


@Injectable()
class UserRepository {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterMikroOrm>,
  ) { }

  async getUserById(id: number) {
    // Use the transactional EntityManager directly
    return await this.tx.findOne(User, { id });
  }

  async createUser(name: string) {
    // Use the transactional EntityManager directly
    const user = this.tx.create(User, {
      name,
      email: `${name}@email.com`,
    });
    await this.tx.persistAndFlush(user); // Save the user entity
    return user;
  }
}


@Injectable()
class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly transactionHost: TransactionHost<TransactionalAdapterMikroOrm>,
    private readonly orm: MikroORM,
  ) { }

  @UseCls()
  async withoutTransaction() {
    const r1 = await this.userRepository.createUser('Jim');
    const r2 = await this.userRepository.getUserById(r1.id);
    return { r1, r2 };
  }

  @Transactional()
  async transactionWithDecorator() {
    const r1 = await this.userRepository.createUser('John');
    const r2 = await this.userRepository.getUserById(r1.id);
    return { r1, r2 };
  }

  @Transactional<TransactionalAdapterMikroOrm>({
    isolationLevel: IsolationLevel.SERIALIZABLE,
  })
  async transactionWithDecoratorWithOptions() {
    const r1 = await this.userRepository.createUser('James');
    const r2 = await this.orm.em.findOne(User, { id: r1.id });
    const r3 = await this.userRepository.getUserById(r1.id);
    return { r1, r2, r3 };
  }

  async transactionWithFunctionWrapper() {
    return this.transactionHost.withTransaction(
      { isolationLevel: IsolationLevel.SERIALIZABLE },
      async () => {
        const r1 = await this.userRepository.createUser('Joe');
        const r2 = await this.orm.em.findOne(User, { id: r1.id });
        const r3 = await this.userRepository.getUserById(r1.id);
        return { r1, r2, r3 };
      },
    );
  }

  @Transactional()
  async transactionWithDecoratorError() {
    await this.userRepository.createUser('Nobody');
    throw new Error('Rollback');
  }
}

@Module({
  providers: [
    {
      provide: MikroORM,
      useValue: mikroOrm,
    },
    UserRepository,
    UserService,
  ],
  exports: [MikroORM],
})
class MikroOrmModule { }

@Module({
  imports: [
    MikroOrmModule,
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [MikroOrmModule],
          adapter: new TransactionalAdapterMikroOrm({
            dataSourceToken: MikroORM,
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
  ],
  providers: [UserRepository, UserService],
})
class AppModule { }

describe('TransactionalAdapterMikroOrm', () => {
  let module: TestingModule;
  let callingService: UserService;

  beforeAll(async () => {
    execSync(
      'docker compose -f test/docker-compose.yml up -d --quiet-pull --wait',
      {
        stdio: 'inherit',
        cwd: process.cwd(),
      },
    );
    const orm = await mikroOrm;
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  }, 60_000);

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    await module.init();
    callingService = module.get(UserService);
  });

  afterAll(async () => {
    const orm = await mikroOrm;
    await orm.close(true);
    execSync('docker compose -f test/docker-compose.yml down', {
      stdio: 'inherit',
    });
  }, 60_000);

  describe('Transactions', () => {
    it('should work without an active transaction', async () => {
      const { r1, r2 } = await callingService.withoutTransaction();
      expect(r1).toEqual(r2);
      const orm = await mikroOrm;
      const users = await orm.em.find(User, {});
      expect(users).toEqual(expect.arrayContaining([r1]));
    });

    it('should run a transaction with the default options with a decorator', async () => {
      const { r1, r2 } = await callingService.transactionWithDecorator();
      expect(r1).toEqual(r2);
      const orm = await mikroOrm;
      const users = await orm.em.find(User, {});
      expect(users).toEqual(expect.arrayContaining([r1]));
    });

    it('should run a transaction with the specified options with a decorator', async () => {
      const { r1, r2, r3 } =
        await callingService.transactionWithDecoratorWithOptions();
      expect(r1).toEqual(r3);
      expect(r2).toBeNull();
      const orm = await mikroOrm;
      const users = await orm.em.find(User, {});
      expect(users).toEqual(expect.arrayContaining([r1]));
    });

    it('should run a transaction with the specified options with a function wrapper', async () => {
      const { r1, r2, r3 } =
        await callingService.transactionWithFunctionWrapper();
      expect(r1).toEqual(r3);
      expect(r2).toBeNull();
      const orm = await mikroOrm;
      const users = await orm.em.find(User, {});
      expect(users).toEqual(expect.arrayContaining([r1]));
    });

    it('should rollback a transaction on error', async () => {
      await expect(
        callingService.transactionWithDecoratorError(),
      ).rejects.toThrow(new Error('Rollback'));
      const orm = await mikroOrm;
      const users = await orm.em.find(User, {});
      expect(users).toEqual(
        expect.not.arrayContaining([{ name: 'Nobody' }]),
      );
    });
  });
});
