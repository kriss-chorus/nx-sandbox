import { InputType, Field } from '@nestjs/graphql';
import { IsString, MaxLength } from 'class-validator';

/**
 * Add Repository to Dashboard Input Type
 * Single Responsibility: Define input structure for adding a repository to a dashboard
 */
@InputType()
export class AddRepositoryToDashboardInput {
  @Field()
  @IsString()
  @MaxLength(255)
  name: string;
}
