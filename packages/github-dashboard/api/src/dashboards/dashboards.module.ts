import { Module } from '@nestjs/common';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { DashboardRepository } from '../database/repositories/dashboard.repository';

@Module({
  controllers: [DashboardsController],
  providers: [DashboardsService, DashboardRepository],
  exports: [DashboardsService],
})
export class DashboardsModule {}
