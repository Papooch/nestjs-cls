import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'item ' })
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
}
