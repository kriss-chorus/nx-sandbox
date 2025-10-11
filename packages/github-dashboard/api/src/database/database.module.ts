import { Global, Module } from '@nestjs/common';
import { DatabaseConnection } from './connection';
import { DashboardRepository } from './repositories/dashboard.repository';
import { GitHubUserRepository } from './repositories/github-user.repository';
import { DashboardUserRepository } from './repositories/dashboard-user.repository';
import { DashboardRepositoryRepository } from './repositories/dashboard-repository.repository';
import { ActivityTypeRepository } from './repositories/activity-type.repository';
import { DashboardActivityConfigRepository } from './repositories/dashboard-activity-config.repository';

@Global()
@Module({
  providers: [
    {
      provide: DatabaseConnection,
      useFactory: () => DatabaseConnection.getInstance(),
    },
    DashboardRepository,
    GitHubUserRepository,
    DashboardUserRepository,
    DashboardRepositoryRepository,
    ActivityTypeRepository,
    DashboardActivityConfigRepository,
  ],
  exports: [
    DatabaseConnection,
    DashboardRepository,
    GitHubUserRepository,
    DashboardUserRepository,
    DashboardRepositoryRepository,
    ActivityTypeRepository,
    DashboardActivityConfigRepository,
  ],
})
export class DatabaseModule {}
