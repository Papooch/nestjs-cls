import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ClsService } from '../../../src';
import { TestException } from '../../common/test.exception';
import { TestGuard } from '../../common/test.guard';
import { TestInterceptor } from '../../common/test.interceptor';
import { TestGqlExceptionFilter } from '../test-gql.filter';
import { Item, NestedItem } from './item.model';
import { ItemService } from './item.service';

@UseFilters(TestGqlExceptionFilter)
@UseGuards(TestGuard)
@Resolver(() => Item)
export class ItemResolver {
    constructor(
        private readonly recipesService: ItemService,
        private readonly cls: ClsService,
    ) {}

    @UseInterceptors(TestInterceptor)
    @Query(() => [Item])
    items(): Promise<Item[]> {
        this.cls.set('FROM_RESOLVER', this.cls.getId());
        return this.recipesService.findAll();
    }

    @UseInterceptors(TestInterceptor)
    @Query(() => [Item])
    async error(): Promise<Item[]> {
        this.cls.set('FROM_RESOLVER', this.cls.getId());
        const response = await this.recipesService.findAll();
        throw new TestException(response[0]);
    }

    @ResolveField(() => NestedItem)
    async nested() {
        const nested = new NestedItem();
        nested.fromNestedResolver = this.cls.getId();
        return nested;
    }
}
