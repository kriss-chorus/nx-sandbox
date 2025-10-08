import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * Activity Type GraphQL Object Type
 * Single Responsibility: Define the ActivityType entity structure for GraphQL
 */
@ObjectType()
export class ActivityType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  displayName: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  category: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
