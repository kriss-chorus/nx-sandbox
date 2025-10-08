import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { DashboardsService } from '../../dashboards/dashboards.service';
import { 
  Dashboard, 
  GitHubUser, 
  ActivityConfig 
} from '../types';
import { 
  CreateDashboardInput, 
  UpdateDashboardInput,
  AddUserToDashboardInput,
  AddRepositoryToDashboardInput,
  UpdateActivityConfigInput
} from '../inputs';

/**
 * Dashboard GraphQL Resolver
 * Single Responsibility: Handle all GraphQL operations related to dashboards
 */
@Resolver(() => Dashboard)
export class DashboardResolver {
  constructor(private readonly dashboardsService: DashboardsService) {}

  // Query Resolvers
  @Query(() => [Dashboard], { name: 'dashboards' })
  async getDashboards(): Promise<Dashboard[]> {
    return this.dashboardsService.findAllPublic();
  }

  @Query(() => Dashboard, { name: 'dashboard', nullable: true })
  async getDashboard(@Args('slug') slug: string): Promise<Dashboard | null> {
    return this.dashboardsService.findBySlug(slug);
  }

  @Query(() => [String], { name: 'dashboardRepositories' })
  async getDashboardRepositories(@Args('dashboardId') dashboardId: string): Promise<string[]> {
    return this.dashboardsService.getDashboardRepositories(dashboardId);
  }

  @Query(() => ActivityConfig, { name: 'dashboardActivityConfig' })
  async getDashboardActivityConfig(@Args('dashboardId') dashboardId: string): Promise<ActivityConfig> {
    return this.dashboardsService.getActivityConfiguration(dashboardId);
  }

  // Mutation Resolvers
  @Mutation(() => String, { name: 'createDashboard' })
  async createDashboard(@Args('input') input: CreateDashboardInput): Promise<string> {
    const dashboard = await this.dashboardsService.create(input);
    return dashboard.id;
  }

  @Mutation(() => String, { name: 'updateDashboard' })
  async updateDashboard(
    @Args('id') id: string,
    @Args('input') input: UpdateDashboardInput
  ): Promise<string> {
    const dashboard = await this.dashboardsService.update(id, input);
    return dashboard.id;
  }

  @Mutation(() => Boolean, { name: 'deleteDashboard' })
  async deleteDashboard(@Args('id') id: string): Promise<boolean> {
    await this.dashboardsService.remove(id);
    return true;
  }

  @Mutation(() => String, { name: 'addUserToDashboard' })
  async addUserToDashboard(
    @Args('dashboardId') dashboardId: string,
    @Args('input') input: AddUserToDashboardInput
  ): Promise<string> {
    const dashboardUser = await this.dashboardsService.addUserToDashboard(dashboardId, input);
    return dashboardUser.id;
  }

  @Mutation(() => Boolean, { name: 'removeUserFromDashboard' })
  async removeUserFromDashboard(
    @Args('dashboardId') dashboardId: string,
    @Args('username') username: string
  ): Promise<boolean> {
    await this.dashboardsService.removeUserFromDashboard(dashboardId, username);
    return true;
  }

  @Mutation(() => Boolean, { name: 'addRepositoryToDashboard' })
  async addRepositoryToDashboard(
    @Args('dashboardId') dashboardId: string,
    @Args('input') input: AddRepositoryToDashboardInput
  ): Promise<boolean> {
    await this.dashboardsService.addRepositoryToDashboard(dashboardId, input.name);
    return true;
  }

  @Mutation(() => Boolean, { name: 'removeRepositoryFromDashboard' })
  async removeRepositoryFromDashboard(
    @Args('dashboardId') dashboardId: string,
    @Args('repositoryName') repositoryName: string
  ): Promise<boolean> {
    await this.dashboardsService.removeRepositoryFromDashboard(dashboardId, repositoryName);
    return true;
  }

  @Mutation(() => ActivityConfig, { name: 'updateDashboardActivityConfig' })
  async updateDashboardActivityConfig(
    @Args('dashboardId') dashboardId: string,
    @Args('input') input: UpdateActivityConfigInput
  ): Promise<ActivityConfig> {
    return this.dashboardsService.updateActivityConfiguration(dashboardId, input);
  }

  // Field Resolvers
  @ResolveField(() => [GitHubUser], { name: 'users' })
  async getUsers(@Parent() dashboard: Dashboard): Promise<GitHubUser[]> {
    return this.dashboardsService.getDashboardUsers(dashboard.id);
  }

  @ResolveField(() => ActivityConfig, { name: 'activityConfig' })
  async getActivityConfig(@Parent() dashboard: Dashboard): Promise<ActivityConfig> {
    return this.dashboardsService.getActivityConfiguration(dashboard.id);
  }
}
