import { IsBoolean, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @IsOptional()
  @IsString()
  start?: string;

  @IsOptional()
  @IsString()
  end?: string;
}

export class ActivityConfigDto {
  @IsBoolean()
  trackPRsCreated: boolean;

  @IsBoolean()
  trackPRsMerged: boolean;

  @IsBoolean()
  trackPRReviews: boolean;

  @IsBoolean()
  trackCommits: boolean;

  @IsBoolean()
  trackIssues: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;
}

export class UpdateActivityConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityConfigItemDto)
  configs: ActivityConfigItemDto[];
}

export class ActivityConfigItemDto {
  @IsString()
  activityTypeName: string; // e.g., 'prs_opened', 'pr_reviews'

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  dateRangeStart?: string;

  @IsOptional()
  @IsString()
  dateRangeEnd?: string;
}
