import { NotFoundException, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { ClsService } from '../../../src';
import { TestGuard } from '../../common/test.guard';
import { TestInterceptor } from '../../common/test.interceptor';
import { NewRecipeInput } from './dto/new-recipe.input';
import { RecipesArgs } from './dto/recipes.args';
import { Recipe } from './recipe.model';
import { RecipesService } from './recipes.service';

@UseGuards(TestGuard)
@Resolver((of) => Recipe)
export class RecipesResolver {
    constructor(
        private readonly recipesService: RecipesService,
        private readonly cls: ClsService,
    ) {}

    @UseInterceptors(TestInterceptor)
    @Query(() => [Recipe])
    recipes(@Args() recipesArgs: RecipesArgs): Promise<Recipe[]> {
        this.cls.set('FROM_RESOLVER', 'OK');
        return this.recipesService.findAll(recipesArgs);
    }
}
