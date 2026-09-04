import { Injectable } from '@nestjs/common';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionAdapterMock } from '../transaction-adapter-mock';

@Injectable()
export class UnitTestableRepository {
    constructor(
        private readonly txHost: TransactionHost<TransactionAdapterMock>,
    ) {}

    async repositoryMethod() {
        return this.txHost.tx.query('CREATE ENTITY');
    }
}

@Injectable()
export class UnitTestableService {
    constructor(private readonly repo: UnitTestableRepository) {}

    @Transactional()
    async decoratedServiceMethod() {
        return this.repo.repositoryMethod();
    }
}
