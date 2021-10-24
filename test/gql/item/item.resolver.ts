import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { ClsService } from '../../../src';
import { TestException } from '../../common/test.exception';
import { TestGuard } from '../../common/test.guard';
import { TestInterceptor } from '../../common/test.interceptor';
import { RecipesArgs } from './dto/recipes.args';
import { Item } from './item.model';
import { ItemService } from './item.service';
import { TestGqlExceptionFilter } from '../test-gql.filter';

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
    items(@Args() recipesArgs: RecipesArgs): Promise<Item[]> {
        this.cls.set('FROM_RESOLVER', this.cls.getId());
        return this.recipesService.findAll(recipesArgs);
    }

    @UseInterceptors(TestInterceptor)
    @Query(() => [Item])
    async error(@Args() recipesArgs: RecipesArgs): Promise<Item[]> {
        this.cls.set('FROM_RESOLVER', this.cls.getId());
        const response = await this.recipesService.findAll(recipesArgs);
        throw new TestException(response[0]);
    }
}
