import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class RecipesArgs {
    @Field(() => Int)
    skip = 0;

    @Field(() => Int)
    take = 25;
}
