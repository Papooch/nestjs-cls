import { Module } from '@nestjs/common';
import { MercuriusModule } from 'nestjs-mercurius';
import { ClsModule } from '../../src';
import { ItemModule } from './item/item.module';

@Module({
    imports: [
        ClsModule.register({ global: true }),
        ItemModule,
        MercuriusModule.forRoot({
            autoSchemaFile: __dirname + 'schema.gql',
        }),
    ],
})
export class AppModule {}
