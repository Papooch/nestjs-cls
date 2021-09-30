import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ClsModule } from '../../src';
import { RecipesModule } from './recipes/recipes.module';

@Module({
    imports: [
        ClsModule.register({ global: true }),
        RecipesModule,
        GraphQLModule.forRoot({
            autoSchemaFile: __dirname + 'schema.gql',
        }),
    ],
})
export class AppModule {}
