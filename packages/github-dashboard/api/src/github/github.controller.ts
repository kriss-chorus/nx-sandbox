import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { GitHubService } from './github.service';
import { GitHubUser, GitHubRepo, GitHubPullRequest } from './interfaces';

@Controller('github')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  /**
   * Get batch activity summary for multiple users by dashboard ID
   * GET /api/github/users/batch-activity-summary?dashboard_id=uuid&repos=owner/repo1&start_date=2024-01-01&end_date=2024-12-31
   */
  @Get('users/batch-activity-summary')
  @HttpCode(HttpStatus.OK)
  async getBatchUserActivitySummary(
    @Query('dashboard_id') dashboardId: string,
    @Query('repos') repos?: string | string[],
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string
  ) {
    const repoList = Array.isArray(repos)
      ? (repos as string[]).map(r => r.trim()).filter(Boolean)
      : (repos ? (repos as string).split(',').map(r => r.trim()).filter(Boolean) : []);
    return this.githubService.getBatchUserActivitySummaryByDashboard(dashboardId, repoList, startDate, endDate);
  }

  /**
   * Get cached batch activity summary for multiple users by dashboard ID
   * Uses in-memory cache to minimize GitHub API calls and filters data server-side
   * GET /api/github/users/cached-batch-activity-summary?dashboard_id=uuid&repos=owner/repo1&start_date=2024-01-01&end_date=2024-12-31
   */
  @Get('users/cached-batch-activity-summary')
  @HttpCode(HttpStatus.OK)
  async getCachedBatchUserActivitySummary(
    @Query('dashboard_id') dashboardId: string,
    @Query('repos') repos?: string | string[],
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('include_reviews') includeReviews?: string,
    @Query('users') users?: string | string[],
    @Query('no_cache') noCache?: string
  ) {
    const repoList = Array.isArray(repos)
      ? (repos as string[]).map(r => r.trim()).filter(Boolean)
      : (repos ? (repos as string).split(',').map(r => r.trim()).filter(Boolean) : []);
    const include = includeReviews !== 'false';
    const userList = Array.isArray(users)
      ? (users as string[]).map(u => u.trim()).filter(Boolean)
      : (users ? (users as string).split(',').map(u => u.trim()).filter(Boolean) : []);
    const bypassCache = noCache === 'true' || noCache === '1';
    return this.githubService.getCachedBatchUserActivitySummaryByDashboard(dashboardId, repoList, startDate, endDate, include, userList, bypassCache);
  }

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
   * Get repository information
   * GET /api/github/repos/:owner/:repo
   */
  @Get('repos/:owner/:repo')
  async getRepository(
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ): Promise<GitHubRepo> {
    return this.githubService.getRepository(owner, repo);
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
    prsCreated: number;
    prsReviewed: number;
    prsMerged: number;
    totalActivity: number;
    repos: Array<{
      repo: string;
      prsCreated: number;
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
    @Query('repos') repos: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string
  ): Promise<{
    user: GitHubUser;
    activity: {
      prsCreated: number;
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
      activity: {
        prsCreated: number;
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
    return this.githubService.getUserActivitySummary(username, repoList, startDate, endDate);
  }

  /**
   * Get authentication status and available scopes
   * GET /api/github/auth/status
   */
  @Get('auth/status')
  @HttpCode(HttpStatus.OK)
  async getAuthStatus(): Promise<{
    authenticated: boolean;
    hasToken: boolean;
    scopes: string[];
    rateLimit: {
      limit: number;
      remaining: number;
      reset: number;
    };
  }> {
    return this.githubService.getAuthStatus();
  }

  /**
   * Get reviews for a specific pull request
   * GET /api/github/repos/:owner/:repo/pulls/:pullNumber/reviews
   */
  @Get('repos/:owner/:repo/pulls/:pullNumber/reviews')
  @HttpCode(HttpStatus.OK)
  async getPullRequestReviews(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('pullNumber') pullNumber: string
  ): Promise<any[]> {
    return this.githubService.getPullRequestReviews(owner, repo, parseInt(pullNumber, 10));
  }

  /**
   * Get organization review summary for multiple repositories
   * GET /api/github/org/review-summary?repos=owner1/repo1,owner2/repo2&startDate=2024-01-01&endDate=2024-01-07
   */
  @Get('org/review-summary')
  @HttpCode(HttpStatus.OK)
  async getOrganizationReviewSummary(
    @Query('repos') repos: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<{
    reviewerStats: { [reviewer: string]: { prsReviewed: number; prs: string[] } };
    totalReviews: number;
    dateRange: { start: string; end: string };
  }> {
    const repositoryList = repos.split(',').map(repo => repo.trim());
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Limit to first 3 repositories to avoid timeout
    const limitedRepos = repositoryList.slice(0, 3);
    
    return this.githubService.getOrganizationReviewSummary(limitedRepos, start, end);
  }

  /**
   * Get organization repositories
   * GET /api/github/org/:orgName/repos
   */
  @Get('org/:orgName/repos')
  @HttpCode(HttpStatus.OK)
  async getOrganizationRepositories(
    @Param('orgName') orgName: string
  ): Promise<any[]> {
    return this.githubService.getOrganizationRepositories(orgName);
  }

  /**
   * Get organization members (past and present)
   * GET /api/github/org/:orgName/members
   */
  @Get('org/:orgName/members')
  @HttpCode(HttpStatus.OK)
  async getOrganizationMembers(
    @Param('orgName') orgName: string
  ): Promise<any[]> {
    return this.githubService.getOrganizationMembers(orgName);
  }
}
