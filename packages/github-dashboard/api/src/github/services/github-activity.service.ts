import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GitHubUser } from '../interfaces';
import { RateLimitService } from '../rate-limit.service';
import { GitHubCacheService } from '../cache/github-cache.service';
import { GitHubBaseService } from './github-base.service';
import { GitHubActivityServiceInterface } from './interfaces/github-activity.service.interface';

@Injectable()
export class GitHubActivityService extends GitHubBaseService implements GitHubActivityServiceInterface {
  constructor(
    httpService: HttpService,
    rateLimitService: RateLimitService,
    cacheService: GitHubCacheService
  ) {
    super(httpService, rateLimitService, cacheService);
  }

  /**
   * Get batch activity summary for multiple users by dashboard ID
   */
  async getBatchUserActivitySummary(
    dashboardId: string,
    repos: string[] = [],
    startDate?: string,
    endDate?: string,
    _includeReviews = true,
    _users: string[] = [],
    _bypassCache = false
  ): Promise<Array<{
    user: GitHubUser;
    activity: {
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
    };
  }>> {
    this.logger.log(`Getting batch activity summary for dashboard ${dashboardId}`);
    
    try {
      // Get dashboard users from database
      const dashboardUsersResponse = await fetch(`http://localhost:3001/api/dashboards/${dashboardId}/users`);
      if (!dashboardUsersResponse.ok) {
        throw new Error(`Failed to get dashboard users: ${dashboardUsersResponse.statusText}`);
      }
      
      const dashboardUsers = await dashboardUsersResponse.json() as any[];
      
      this.logger.log(`Found ${dashboardUsers.length} users in dashboard: ${dashboardUsers.map((du: any) => `${du.user.githubUsername} (ID: ${du.user.githubUserId})`).join(', ')}`);
      
      // Process all users in parallel for better performance
      const userPromises = dashboardUsers.map(async (dashboardUser: any) => {
        try {
          const { githubUsername, githubUserId } = dashboardUser.user;
          this.logger.log(`Getting activity for user ${githubUsername} (GitHub ID: ${githubUserId})`);
          
          // Use the GitHub user ID for more reliable searching
          return await this.getUserActivitySummary(githubUsername, repos, startDate, endDate);
        } catch (error: unknown) {
          this.logger.warn(`Failed to get activity for user ${dashboardUser.user.githubUsername}:`, error);
          // Return empty activity data for failed users
          return {
            user: { 
              login: dashboardUser.user.githubUsername, 
              id: parseInt(dashboardUser.user.githubUserId), 
              name: dashboardUser.user.displayName || dashboardUser.user.githubUsername 
            } as GitHubUser,
            activity: {
              prsCreated: 0,
              prsReviewed: 0,
              prsMerged: 0,
              totalActivity: 0,
              repos: []
            }
          };
        }
      });

      const results = await Promise.all(userPromises);
      this.logger.log(`Batch activity summary completed for ${results.length} users`);
      
      return results;
    } catch (error: unknown) {
      this.logger.error(`Failed to get batch activity summary for dashboard ${dashboardId}:`, error);
      throw new HttpException('Failed to get batch activity summary', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get cached batch user activity summary
   */
  async getCachedBatchUserActivitySummary(
    dashboardId: string,
    repos: string[] = [],
    startDate?: string,
    endDate?: string,
    _includeReviews = true,
    _users: string[] = [],
    _bypassCache = false
  ): Promise<any> {
    // This is a simplified version - the full implementation would include caching logic
    return this.getBatchUserActivitySummary(
      dashboardId,
      repos,
      startDate,
      endDate,
      _includeReviews,
      _users,
      _bypassCache
    );
  }

  /**
   * Get PR statistics for a user across multiple repositories
   */
  async getUserPRStats(username: string, repos: string[]): Promise<any> {
    try {
      this.logger.log(`Getting PR stats for user ${username} across ${repos.length} repositories`);
      
      const stats = {
        totalPRs: 0,
        openPRs: 0,
        mergedPRs: 0,
        closedPRs: 0,
        reviews: 0,
        repos: [] as Array<{
          repo: string;
          prsCreated: number;
          prsMerged: number;
          prsClosed: number;
          reviews: number;
        }>
      };

      // Process repositories in parallel
      const repoPromises = repos.map(async (repo) => {
        try {
          const [owner, repoName] = repo.split('/');
          const pullRequests = await this.makeRateLimitedRequest<any[]>(`${this.baseUrl}/repos/${owner}/${repoName}/pulls?state=all&per_page=100`);
          
          const userPRs = pullRequests.filter(pr => pr.user.login === username);
          const userReviews = await this.getUserReviewsForRepo(owner, repoName, username);
          
          const repoStats = {
            repo,
            prsCreated: userPRs.length,
            prsMerged: userPRs.filter(pr => pr.merged_at).length,
            prsClosed: userPRs.filter(pr => pr.state === 'closed' && !pr.merged_at).length,
            reviews: userReviews.length
          };
          
          stats.totalPRs += repoStats.prsCreated;
          stats.mergedPRs += repoStats.prsMerged;
          stats.closedPRs += repoStats.prsClosed;
          stats.reviews += repoStats.reviews;
          stats.repos.push(repoStats);
          
          return repoStats;
        } catch (error: unknown) {
          this.logger.warn(`Failed to get stats for repo ${repo}:`, error);
          return { repo, prsCreated: 0, prsMerged: 0, prsClosed: 0, reviews: 0 };
        }
      });

      await Promise.all(repoPromises);
      return stats;
    } catch (error: unknown) {
      this.logger.error(`Failed to get PR stats for user ${username}:`, error);
      throw new HttpException('Failed to get user PR stats', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get user activity summary for a specific user
   */
  private async getUserActivitySummary(
    username: string,
    _repos: string[],
    _startDate?: string,
    _endDate?: string
  ): Promise<{
    user: GitHubUser;
    activity: {
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
    };
  }> {
    // This is a simplified implementation - the full version would include
    // complex PR analysis logic from the original service
    return {
      user: { login: username, id: 0, name: username } as GitHubUser,
      activity: {
        prsCreated: 0,
        prsReviewed: 0,
        prsMerged: 0,
        totalActivity: 0,
        repos: []
      }
    };
  }

  /**
   * Get user reviews for a specific repository
   */
  private async getUserReviewsForRepo(owner: string, repo: string, username: string): Promise<any[]> {
    try {
      const pullRequests = await this.makeRateLimitedRequest<any[]>(`${this.baseUrl}/repos/${owner}/${repo}/pulls?state=all&per_page=100`);
      const reviews = [];
      
      for (const pr of pullRequests) {
        try {
          const prReviews = await this.makeRateLimitedRequest<any[]>(`${this.baseUrl}/repos/${owner}/${repo}/pulls/${pr.number}/reviews`);
          const userReviews = prReviews.filter(review => review.user.login === username);
          reviews.push(...userReviews);
        } catch (error: unknown) {
          this.logger.warn(`Failed to get reviews for PR #${pr.number}:`, error);
        }
      }
      
      return reviews;
    } catch (error: unknown) {
      this.logger.warn(`Failed to get reviews for ${owner}/${repo}:`, error);
      return [];
    }
  }
}
