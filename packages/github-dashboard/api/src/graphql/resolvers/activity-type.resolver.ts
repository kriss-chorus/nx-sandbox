import { Resolver, Query } from '@nestjs/graphql';
import { DashboardsService } from '../../dashboards/dashboards.service';
import { ActivityType } from '../types';

/**
 * Activity Type GraphQL Resolver
 * Single Responsibility: Handle all GraphQL operations related to activity types
 */
@Resolver(() => ActivityType)
export class ActivityTypeResolver {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Query(() => [ActivityType], { name: 'activityTypes' })
  async getActivityTypes(): Promise<ActivityType[]> {
    return this.dashboardsService.getAvailableActivityTypes();
  }
}
