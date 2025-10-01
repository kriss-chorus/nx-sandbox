import { Global, Module } from '@nestjs/common';
import { DatabaseConnection } from './connection';
import { DashboardRepository } from './repositories/dashboard.repository';
import { DashboardUserRepository } from './repositories/dashboard-user.repository';
import { DashboardRepositoryRepository } from './repositories/dashboard-repository.repository';

@Global()
@Module({
  providers: [
    DatabaseConnection,
    DashboardRepository,
    DashboardUserRepository,
    DashboardRepositoryRepository,
  ],
  exports: [
    DatabaseConnection,
    DashboardRepository,
    DashboardUserRepository,
    DashboardRepositoryRepository,
  ],
})
export class DatabaseModule {}
