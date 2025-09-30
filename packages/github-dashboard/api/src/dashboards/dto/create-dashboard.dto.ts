import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateDashboardDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
