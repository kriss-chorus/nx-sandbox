import { Global, Module } from '@nestjs/common';
import { DatabaseConnection } from './connection';
import { DashboardRepository } from './repositories/dashboard.repository';
import { DashboardUserRepository } from './repositories/dashboard-user.repository';

@Global()
@Module({
  providers: [
    DatabaseConnection,
    DashboardRepository,
    DashboardUserRepository,
  ],
  exports: [
    DatabaseConnection,
    DashboardRepository,
    DashboardUserRepository,
  ],
})
export class DatabaseModule {}
