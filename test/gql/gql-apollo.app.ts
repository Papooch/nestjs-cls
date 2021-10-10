import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ClsModule } from '../../src';
import { ItemModule } from './item/item.module';

@Module({
    imports: [
        ClsModule.register({ global: true }),
        ItemModule,
        GraphQLModule.forRoot({
            autoSchemaFile: __dirname + 'schema.gql',
        }),
    ],
})
export class AppModule {}
