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

// Response DTO that includes both ID and username
export class DashboardUserDto {
  id: string;
  githubUserId: string;
  githubUsername: string;
  displayName?: string;
  addedAt: Date;
}
