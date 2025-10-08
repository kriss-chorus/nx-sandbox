import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * GitHub User GraphQL Object Type
 * Single Responsibility: Define the GitHubUser entity structure for GraphQL
 */
@ObjectType()
export class GitHubUser {
  @Field(() => ID)
  id: string;

  @Field()
  githubUserId: string;

  @Field()
  githubUsername: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  profileUrl?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
