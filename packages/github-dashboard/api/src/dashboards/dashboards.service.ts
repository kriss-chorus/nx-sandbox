import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DashboardRepository } from '../database/repositories/dashboard.repository';
import { DashboardUserRepository } from '../database/repositories/dashboard-user.repository';
import { DashboardRepositoryRepository } from '../database/repositories/dashboard-repository.repository';
import { ActivityTypeRepository } from '../database/repositories/activity-type.repository';
import { DashboardActivityConfigRepository } from '../database/repositories/dashboard-activity-config.repository';
import { GitHubService } from '../github/github.service';
import { CreateDashboardDto, UpdateDashboardDto, AddUserToDashboardDto, UpdateActivityConfigDto, ActivityConfigDto } from './dto';
import { Dashboard, DashboardGithubUser, ActivityType, DashboardActivityConfig } from '../database/entities';

@Injectable()
export class DashboardsService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly dashboardUserRepository: DashboardUserRepository,
    private readonly dashboardRepositoryRepository: DashboardRepositoryRepository,
    private readonly activityTypeRepository: ActivityTypeRepository,
    private readonly dashboardActivityConfigRepository: DashboardActivityConfigRepository,
    private readonly githubService: GitHubService
  ) {}

  async create(createDashboardDto: CreateDashboardDto): Promise<Dashboard> {
    const { name, description, isPublic } = createDashboardDto;
    const slug = this.generateSlug(name);

    // Check if slug already exists
    const existing = await this.dashboardRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Dashboard with slug '${slug}' already exists`);
    }

    return this.dashboardRepository.create({
      name,
      slug,
      description,
      isPublic: isPublic ?? true,
    });
  }

  async findAllPublic(): Promise<any[]> {
    const dashboards = await this.dashboardRepository.findPublicDashboards();
    
    // Add user count for each dashboard
    const dashboardsWithUserCount = await Promise.all(
      dashboards.map(async (dashboard) => {
        const users = await this.dashboardUserRepository.getUsersForDashboard(dashboard.id);
        return {
          ...dashboard,
          githubUsers: users.map(user => user.githubUsername),
          userCount: users.length
        };
      })
    );
    
    return dashboardsWithUserCount;
  }

  async findBySlug(slug: string): Promise<any> {
    const dashboard = await this.dashboardRepository.findBySlug(slug);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with slug '${slug}' not found`);
    }
    
    // Add user count and github users list
    const users = await this.dashboardUserRepository.getUsersForDashboard(dashboard.id);
    return {
      ...dashboard,
      githubUsers: users.map(user => user.githubUsername),
      userCount: users.length
    };
  }

  async update(id: string, updateDashboardDto: UpdateDashboardDto): Promise<Dashboard> {
    const existing = await this.dashboardRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Dashboard with id '${id}' not found`);
    }

    const updateData: Partial<UpdateDashboardDto> = { ...updateDashboardDto };
    
    // If name is being updated, generate new slug
    if (updateDashboardDto.name && updateDashboardDto.name !== existing.name) {
      const newSlug = this.generateSlug(updateDashboardDto.name);
      updateData.slug = newSlug;
    }

    const updated = await this.dashboardRepository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Dashboard with id '${id}' not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.dashboardRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Dashboard with id '${id}' not found`);
    }

    const deleted = await this.dashboardRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Dashboard with id '${id}' not found`);
    }
  }

  async addUserToDashboard(dashboardId: string, addUserDto: AddUserToDashboardDto): Promise<DashboardGithubUser> {
    // Verify dashboard exists
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with id '${dashboardId}' not found`);
    }

    // Check if user is already in dashboard
    const existing = await this.dashboardUserRepository.isUserInDashboard(dashboardId, addUserDto.githubUsername);
    if (existing) {
      throw new ConflictException(`User '${addUserDto.githubUsername}' is already in this dashboard`);
    }

    return this.dashboardUserRepository.addUserToDashboard({
      dashboardId,
      githubUsername: addUserDto.githubUsername,
      displayName: addUserDto.displayName || addUserDto.githubUsername,
    });
  }

  async removeUserFromDashboard(dashboardId: string, username: string): Promise<void> {
    // Verify dashboard exists
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with id '${dashboardId}' not found`);
    }

    const removed = await this.dashboardUserRepository.removeUserFromDashboard(dashboardId, username);
    if (!removed) {
      throw new NotFoundException(`User '${username}' not found in dashboard '${dashboardId}'`);
    }
  }

  async getDashboardUsers(dashboardId: string): Promise<DashboardGithubUser[]> {
    // Verify dashboard exists
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with id '${dashboardId}' not found`);
    }

    return this.dashboardUserRepository.getUsersForDashboard(dashboardId);
  }

  // Repository Management Methods
  async addRepositoryToDashboard(dashboardId: string, name: string): Promise<void> {
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID '${dashboardId}' not found`);
    }

    // Check if repository is already in dashboard
    const exists = await this.dashboardRepositoryRepository.isRepositoryInDashboard(dashboardId, name);
    if (exists) {
      throw new ConflictException(`Repository '${name}' is already in this dashboard`);
    }

    // Fetch repository information from GitHub to get the repository ID
    const [owner, repoName] = name.split('/');
    if (!owner || !repoName) {
      throw new ConflictException(`Invalid repository format: ${name}`);
    }

    try {
      // Get repository information from GitHub API
      const repoInfo = await this.githubService.getRepository(owner, repoName);
      await this.dashboardRepositoryRepository.addRepositoryToDashboard(
        dashboardId, 
        name, 
        repoInfo.id
      );
    } catch (error) {
      throw new ConflictException(`Failed to fetch repository information: ${error.message}`);
    }
  }

  async removeRepositoryFromDashboard(dashboardId: string, name: string): Promise<void> {
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID '${dashboardId}' not found`);
    }

    await this.dashboardRepositoryRepository.removeRepositoryFromDashboard(dashboardId, name);
  }

  async getDashboardRepositories(dashboardId: string): Promise<string[]> {
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID '${dashboardId}' not found`);
    }

    const repos = await this.dashboardRepositoryRepository.getDashboardRepositories(dashboardId);
    return repos; // getDashboardRepositories already returns string[]
  }

  // Activity Configuration Methods
  async getActivityConfiguration(dashboardId: string): Promise<ActivityConfigDto> {
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID '${dashboardId}' not found`);
    }

    // Get all activity types
    const activityTypes = await this.activityTypeRepository.findAll();
    
    // Get dashboard-specific configurations
    const configs = await this.dashboardActivityConfigRepository.getDashboardConfigs(dashboardId);
    
    // Create a map of activity type name to configuration
    const configMap = new Map(
      configs.map(config => [
        activityTypes.find(type => type.id === config.activityTypeId)?.name,
        config
      ]).filter(([name]) => name) // Filter out undefined names
    );

    // Build the activity configuration object
    const activityConfig: ActivityConfigDto = {
      trackPRsOpened: configMap.get('prs_opened')?.enabled ?? true,
      trackPRsMerged: configMap.get('prs_merged')?.enabled ?? true,
      trackPRReviews: configMap.get('pr_reviews')?.enabled ?? true,
      trackCommits: configMap.get('commits')?.enabled ?? false,
      trackIssues: configMap.get('issues')?.enabled ?? false,
      dateRange: {
        start: configMap.get('prs_opened')?.dateRangeStart || '',
        end: configMap.get('prs_opened')?.dateRangeEnd || ''
      }
    };

    return activityConfig;
  }

  async updateActivityConfiguration(dashboardId: string, updateDto: UpdateActivityConfigDto): Promise<ActivityConfigDto> {
    const dashboard = await this.dashboardRepository.findById(dashboardId);
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID '${dashboardId}' not found`);
    }

    // Get all activity types
    const activityTypes = await this.activityTypeRepository.findAll();
    const activityTypeMap = new Map(activityTypes.map(type => [type.name, type]));

    // Update configurations
    const configsToUpdate = updateDto.configs.map(config => ({
      activityTypeId: activityTypeMap.get(config.activityTypeName)?.id,
      enabled: config.enabled,
      dateRangeStart: config.dateRangeStart,
      dateRangeEnd: config.dateRangeEnd
    })).filter(config => config.activityTypeId); // Filter out invalid activity types

    await this.dashboardActivityConfigRepository.updateDashboardConfigs(dashboardId, configsToUpdate);

    // Return the updated configuration
    return this.getActivityConfiguration(dashboardId);
  }

  async getAvailableActivityTypes(): Promise<ActivityType[]> {
    return await this.activityTypeRepository.findAll();
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
}
