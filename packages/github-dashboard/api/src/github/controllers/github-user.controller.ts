import { Controller, Get, Param, Query } from '@nestjs/common';

import { GitHubUser } from '../interfaces';
import { GitHubUserService } from '../services/github-user.service';

@Controller('github/users')
export class GitHubUserController {
  constructor(private readonly githubUserService: GitHubUserService) {}

  /**
   * Get GitHub user information
   * GET /api/github/users/:username
   */
  @Get(':username')
  async getUser(@Param('username') username: string): Promise<GitHubUser> {
    return this.githubUserService.getUser(username);
  }

  /**
   * Get user's repositories
   * GET /api/github/users/:username/repos?per_page=30&page=1
   */
  @Get(':username/repos')
  async getUserRepos(
    @Param('username') username: string,
    @Query('per_page') perPage?: number,
    @Query('page') page?: number
  ): Promise<any[]> {
    return this.githubUserService.getUserRepos(username, perPage, page);
  }

  /**
   * Get organization members
   * GET /api/github/users/orgs/:orgName/members
   */
  @Get('orgs/:orgName/members')
  async getOrganizationMembers(@Param('orgName') orgName: string): Promise<any[]> {
    return this.githubUserService.getOrganizationMembers(orgName);
  }

  /**
   * Get user's weekly activity
   * GET /api/github/users/:username/activity?start_date=2024-01-01&end_date=2024-12-31
   */
  @Get(':username/activity')
  async getUserActivity(
    @Param('username') username: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string
  ): Promise<any> {
    return this.githubUserService.getUserActivity(username, startDate, endDate);
  }
}
