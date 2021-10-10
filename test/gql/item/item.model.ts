import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'item ' })
export class Item {
    @Field((type) => ID)
    id: string;

    @Field()
    fromGuard?: string;

    @Field()
    fromInterceptor?: string;

    @Field()
    fromInterceptorAfter?: string;

    @Field()
    fromResolver?: string;

    @Field()
    fromService?: string;
}
