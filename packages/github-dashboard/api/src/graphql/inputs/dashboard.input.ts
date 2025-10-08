import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

/**
 * Create Dashboard Input Type
 * Single Responsibility: Define input structure for creating a dashboard
 */
@InputType()
export class CreateDashboardInput {
  @Field()
  @IsString()
  @MaxLength(255)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

/**
 * Update Dashboard Input Type
 * Single Responsibility: Define input structure for updating a dashboard
 */
@InputType()
export class UpdateDashboardInput {
  @Field()
  @IsString()
  @MaxLength(255)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
