import { Module } from '@nestjs/common';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { DashboardUserRepository } from '../database/repositories/dashboard-user.repository';
import { DashboardRepositoryRepository } from '../database/repositories/dashboard-repository.repository';
import { ActivityTypeRepository } from '../database/repositories/activity-type.repository';
import { DashboardActivityConfigRepository } from '../database/repositories/dashboard-activity-config.repository';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [GitHubModule],
  controllers: [DashboardsController],
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
