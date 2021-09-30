import { Module } from '@nestjs/common';
import { MercuriusModule } from 'nestjs-mercurius';
import { ClsModule } from '../../src';
import { RecipesModule } from './recipes/recipes.module';

@Module({
    imports: [
        ClsModule.register({ global: true }),
        RecipesModule,
        MercuriusModule.forRoot({
            autoSchemaFile: __dirname + 'schema.gql',
        }),
    ],
})
export class AppModule {}
