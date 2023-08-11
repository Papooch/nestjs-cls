import { Module } from '@nestjs/common';
import { ItemResolver } from './item.resolver';
import { ItemService } from './item.service';

@Module({
    providers: [ItemResolver, ItemService],
})
export class ItemModule {}
