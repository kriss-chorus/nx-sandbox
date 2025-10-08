import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GitHubUser } from './github-user.type';
import { ActivityConfig } from './activity-config.type';

/**
 * Dashboard GraphQL Object Type
 * Single Responsibility: Define the Dashboard entity structure for GraphQL
 */
@ObjectType()
export class Dashboard {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isPublic: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Computed fields
  @Field(() => Int, { nullable: true })
  userCount?: number;

  @Field(() => [GitHubUser], { nullable: true })
  users?: GitHubUser[];

  @Field(() => [String], { nullable: true })
  repositories?: string[];

  @Field(() => ActivityConfig, { nullable: true })
  activityConfig?: ActivityConfig;
}
