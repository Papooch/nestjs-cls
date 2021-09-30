import { Injectable } from '@nestjs/common';
import { ClsService } from '../../../src';
import { NewRecipeInput } from './dto/new-recipe.input';
import { RecipesArgs } from './dto/recipes.args';
import { Recipe } from './recipe.model';

@Injectable()
export class RecipesService {
    constructor(private readonly cls: ClsService) {}

    async findAll(recipesArgs: RecipesArgs): Promise<Recipe[]> {
        return [
            {
                id: this.cls.get('FROM_INTERCEPTOR'),
                title: this.cls.get('FROM_GUARD'),
                description: this.cls.get('FROM_RESOLVER'),
            },
        ] as any[];
    }
}
