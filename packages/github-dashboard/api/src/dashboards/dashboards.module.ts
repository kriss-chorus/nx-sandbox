import { Module } from '@nestjs/common';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { DashboardUserRepository } from '../database/repositories/dashboard-user.repository';

@Module({
  controllers: [DashboardsController],
  providers: [DashboardsService, DashboardUserRepository],
  exports: [DashboardsService],
})
export class DashboardsModule {}
