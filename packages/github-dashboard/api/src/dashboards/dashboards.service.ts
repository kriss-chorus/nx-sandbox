import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DashboardRepository } from '../database/repositories/dashboard.repository';
import { DashboardUserRepository } from '../database/repositories/dashboard-user.repository';
import { DashboardRepositoryRepository } from '../database/repositories/dashboard-repository.repository';
import { GitHubService } from '../github/github.service';
import { CreateDashboardDto, UpdateDashboardDto, AddUserToDashboardDto } from './dto';
import { Dashboard, DashboardGithubUser } from '../database/entities';

@Injectable()
export class DashboardsService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly dashboardUserRepository: DashboardUserRepository,
    private readonly dashboardRepositoryRepository: DashboardRepositoryRepository,
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

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
}
