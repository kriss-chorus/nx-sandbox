import { Module } from '@nestjs/common';

import { ActivityTypeRepository } from '../database/repositories/activity-type.repository';
import { DashboardActivityConfigRepository } from '../database/repositories/dashboard-activity-config.repository';
import { DashboardRepositoryRepository } from '../database/repositories/dashboard-repository.repository';
import { DashboardUserRepository } from '../database/repositories/dashboard-user.repository';
import { GitHubModule } from '../github/github.module';

import { DashboardsService } from './dashboards.service';

@Module({
  imports: [GitHubModule],
  providers: [
    DashboardsService, 
    DashboardUserRepository, 
    DashboardRepositoryRepository,
    ActivityTypeRepository,
    DashboardActivityConfigRepository
  ],
  exports: [DashboardsService],
})
export class DashboardsModule {}
