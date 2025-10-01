import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AddUserToDashboardDto {
  @IsString()
  @IsNotEmpty()
  githubUsername: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class RemoveUserFromDashboardDto {
  @IsString()
  @IsNotEmpty()
  githubUsername: string;
}
