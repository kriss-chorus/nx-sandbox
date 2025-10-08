import { ObjectType, Field } from '@nestjs/graphql';

/**
 * Date Range GraphQL Object Type
 * Single Responsibility: Define date range structure for activity configuration
 */
@ObjectType()
export class DateRange {
  @Field()
  start: string;

  @Field()
  end: string;
}

/**
 * Activity Configuration GraphQL Object Type
 * Single Responsibility: Define activity configuration structure for GraphQL
 */
@ObjectType()
export class ActivityConfig {
  @Field()
  trackPRsCreated: boolean;

  @Field()
  trackPRsMerged: boolean;

  @Field()
  trackPRReviews: boolean;

  @Field()
  trackCommits: boolean;

  @Field()
  trackIssues: boolean;

  @Field(() => DateRange)
  dateRange: DateRange;
}
