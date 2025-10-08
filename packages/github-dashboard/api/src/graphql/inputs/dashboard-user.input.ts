import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * Add User to Dashboard Input Type
 * Single Responsibility: Define input structure for adding a user to a dashboard
 */
@InputType()
export class AddUserToDashboardInput {
  @Field()
  @IsString()
  @MaxLength(255)
  githubUsername: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;
}
