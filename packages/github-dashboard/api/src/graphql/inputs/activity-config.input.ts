import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsDateString } from 'class-validator';

/**
 * Activity Configuration Item Input Type
 * Single Responsibility: Define input structure for individual activity configuration
 */
@InputType()
export class ActivityConfigItemInput {
  @Field()
  @IsString()
  activityTypeName: string;

  @Field()
  enabled: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateRangeStart?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateRangeEnd?: string;
}

/**
 * Update Activity Configuration Input Type
 * Single Responsibility: Define input structure for updating activity configuration
 */
@InputType()
export class UpdateActivityConfigInput {
  @Field(() => [ActivityConfigItemInput])
  configs: ActivityConfigItemInput[];
}
