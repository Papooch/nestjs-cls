import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'nested item' })
export class NestedItem {
    @Field({ nullable: true })
    fromNestedResolver?: string;
}

@ObjectType({ description: 'item' })
export class Item {
    @Field(() => ID)
    id: string;

    @Field({ nullable: true })
    fromGuard?: string;

    @Field({ nullable: true })
    fromInterceptor?: string;

    @Field({ nullable: true })
    fromInterceptorAfter?: string;

    @Field({ nullable: true })
    fromResolver?: string;

    @Field({ nullable: true })
    fromService?: string;

    @Field(() => NestedItem, { nullable: true })
    nested?: NestedItem;
}
