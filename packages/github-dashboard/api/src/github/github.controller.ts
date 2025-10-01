import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { GitHubService } from './github.service';
import { GitHubUser, GitHubRepo, GitHubPullRequest } from './interfaces';

@Controller('github')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  /**
   * Get GitHub user information
   * GET /api/github/users/:username
   */
  @Get('users/:username')
  async getUser(@Param('username') username: string): Promise<GitHubUser> {
    return this.githubService.getUser(username);
  }

  /**
   * Get user's repositories
   * GET /api/github/users/:username/repos?per_page=30&page=1
   */
  @Get('users/:username/repos')
  async getUserRepos(
    @Param('username') username: string,
    @Query('per_page') perPage?: number,
    @Query('page') page?: number
  ): Promise<GitHubRepo[]> {
    return this.githubService.getUserRepos(username, perPage, page);
  }

  /**
   * Get pull requests for a repository
   * GET /api/github/repos/:owner/:repo/pulls?state=all&per_page=30&page=1
   */
  @Get('repos/:owner/:repo/pulls')
  async getPullRequests(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('state') state?: 'open' | 'closed' | 'all',
    @Query('per_page') perPage?: number,
    @Query('page') page?: number
  ): Promise<GitHubPullRequest[]> {
    return this.githubService.getPullRequests(owner, repo, state, perPage, page);
  }

  /**
   * Get PR statistics for a user across multiple repositories
   * POST /api/github/users/:username/pr-stats
   * Body: { repos: ["owner/repo1", "owner/repo2"] }
   */
  @Get('users/:username/pr-stats')
  @HttpCode(HttpStatus.OK)
  async getUserPRStats(
    @Param('username') username: string,
    @Query('repos') repos: string
  ): Promise<{
    totalPRs: number;
    openPRs: number;
    closedPRs: number;
    mergedPRs: number;
    repos: Array<{
      repo: string;
      prCount: number;
      openCount: number;
      closedCount: number;
      mergedCount: number;
    }>;
  }> {
    // Parse comma-separated repos from query parameter
    const repoList = repos ? repos.split(',').map(r => r.trim()) : [];
    return this.githubService.getUserPRStats(username, repoList);
  }

  /**
   * Get weekly PR activity for a user
   * GET /api/github/users/:username/weekly-activity?repos=owner/repo1,owner/repo2
   */
  @Get('users/:username/weekly-activity')
  @HttpCode(HttpStatus.OK)
  async getUserWeeklyActivity(
    @Param('username') username: string,
    @Query('repos') repos: string
  ): Promise<{
    prsOpened: number;
    prsReviewed: number;
    prsMerged: number;
    totalActivity: number;
    repos: Array<{
      repo: string;
      prsOpened: number;
      prsReviewed: number;
      prsMerged: number;
      totalRecentPRs: number;
    }>;
  }> {
    const repoList = repos ? repos.split(',').map(r => r.trim()) : [];
    return this.githubService.getUserWeeklyActivity(username, repoList);
  }

  /**
   * Get comprehensive activity summary for a user
   * GET /api/github/users/:username/activity-summary?repos=owner/repo1,owner/repo2
   */
  @Get('users/:username/activity-summary')
  @HttpCode(HttpStatus.OK)
  async getUserActivitySummary(
    @Param('username') username: string,
    @Query('repos') repos: string
  ): Promise<{
    user: GitHubUser;
    weeklyActivity: {
      prsOpened: number;
      prsReviewed: number;
      prsMerged: number;
      totalActivity: number;
    };
    overallStats: {
      totalPRs: number;
      openPRs: number;
      closedPRs: number;
      mergedPRs: number;
    };
    repos: Array<{
      repo: string;
      weeklyActivity: {
        prsOpened: number;
        prsReviewed: number;
        prsMerged: number;
      };
      overallStats: {
        prCount: number;
        openCount: number;
        closedCount: number;
        mergedCount: number;
      };
    }>;
  }> {
    const repoList = repos ? repos.split(',').map(r => r.trim()) : [];
    return this.githubService.getUserActivitySummary(username, repoList);
  }
}
