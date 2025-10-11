import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { GitHubActivityService } from '../services/github-activity.service';

@Controller('github/activity')
export class GitHubActivityController {
  constructor(private readonly githubActivityService: GitHubActivityService) {}

  /**
   * Get batch activity summary for multiple users by dashboard ID
   * GET /api/github/activity/batch-summary?dashboard_id=uuid&repos=owner/repo1&start_date=2024-01-01&end_date=2024-12-31
   */
  @Get('batch-summary')
  async getCachedBatchUserActivitySummary(
    @Query('dashboard_id') dashboardId: string,
    @Query('repos') repos?: string | string[],
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('include_reviews') includeReviews?: string,
    @Query('users') users?: string | string[],
    @Query('no_cache') noCache?: string
  ) {
    const repoList = Array.isArray(repos) ? repos : (repos ? [repos] : []);
    const userList = Array.isArray(users) ? users : (users ? [users] : []);
    const include = includeReviews === 'true';
    const bypassCache = noCache === 'true';

    return this.githubActivityService.getCachedBatchUserActivitySummary(
      dashboardId,
      repoList,
      startDate,
      endDate,
      include,
      userList,
      bypassCache
    );
  }

  /**
   * Get PR statistics for a user across multiple repositories
   * POST /api/github/activity/users/:username/pr-stats
   * Body: { repos: ["owner/repo1", "owner/repo2"] }
   */
  @Post('users/:username/pr-stats')
  @HttpCode(HttpStatus.OK)
  async getUserPRStats(
    @Param('username') username: string,
    @Body() body: { repos: string[] }
  ) {
    return this.githubActivityService.getUserPRStats(username, body.repos);
  }
}
