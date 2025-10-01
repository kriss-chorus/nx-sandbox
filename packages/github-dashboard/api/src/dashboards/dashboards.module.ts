import { Module } from '@nestjs/common';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { DashboardUserRepository } from '../database/repositories/dashboard-user.repository';
import { DashboardRepositoryRepository } from '../database/repositories/dashboard-repository.repository';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [GitHubModule],
  controllers: [DashboardsController],
  providers: [DashboardsService, DashboardUserRepository, DashboardRepositoryRepository],
  exports: [DashboardsService],
})
export class DashboardsModule {}
