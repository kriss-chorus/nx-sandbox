import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GitHubUser, GitHubRepo, GitHubPullRequest } from './interfaces';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly baseUrl = 'https://api.github.com';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get user information from GitHub API
   * @param username GitHub username
   * @returns User information
   */
  async getUser(username: string): Promise<GitHubUser> {
    try {
      this.logger.log(`Fetching user: ${username}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${username}`)
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch user ${username}:`, errorMessage);
      
      // Check for rate limit issues
      if (error.response?.data?.message?.includes('rate limit exceeded') ||
          errorMessage.includes('rate limit exceeded')) {
        throw new HttpException('GitHub API rate limit exceeded. Please try again later or add authentication.', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Check for various "not found" scenarios
      if (error.response?.status === 404 || 
          error.response?.status === 403 || 
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found')) {
        throw new HttpException(`User '${username}' not found`, HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to fetch user from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get user's repositories
   * @param username GitHub username
   * @param perPage Number of repos per page (max 100)
   * @param page Page number
   * @returns Array of repositories
   */
  async getUserRepos(username: string, perPage = 30, page = 1): Promise<GitHubRepo[]> {
    try {
      this.logger.log(`Fetching repos for user: ${username}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${username}/repos`, {
          params: { per_page: perPage, page, sort: 'updated' }
        })
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch repos for ${username}:`, errorMessage);
      throw new HttpException('Failed to fetch repositories from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get pull requests for a specific repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param state PR state (open, closed, all)
   * @param perPage Number of PRs per page
   * @param page Page number
   * @returns Array of pull requests
   */
  async getPullRequests(
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'all',
    perPage = 30,
    page = 1
  ): Promise<GitHubPullRequest[]> {
    try {
      this.logger.log(`Fetching PRs for ${owner}/${repo}`);
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/repos/${owner}/${repo}/pulls`, {
          params: { state, per_page: perPage, page }
        })
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch PRs for ${owner}/${repo}:`, errorMessage);
      throw new HttpException('Failed to fetch pull requests from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get pull request statistics for a user across multiple repositories
   * @param username GitHub username
   * @param repoList Array of repository names (format: "owner/repo")
   * @returns PR statistics
   */
  async getUserPRStats(username: string, repoList: string[]): Promise<{
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
    const stats = {
      totalPRs: 0,
      openPRs: 0,
      closedPRs: 0,
      mergedPRs: 0,
      repos: [] as Array<{
        repo: string;
        prCount: number;
        openCount: number;
        closedCount: number;
        mergedCount: number;
      }>
    };

    for (const repo of repoList) {
      try {
        const [owner, repoName] = repo.split('/');
        if (!owner || !repoName) {
          this.logger.warn(`Invalid repo format: ${repo}`);
          continue;
        }

        // Get all PRs for this repo
        const allPRs = await this.getPullRequests(owner, repoName, 'all', 100);
        
        // Filter PRs by the user
        const userPRs = allPRs.filter(pr => pr.user.login === username);
        
        const repoStats = {
          repo,
          prCount: userPRs.length,
          openCount: userPRs.filter(pr => pr.state === 'open').length,
          closedCount: userPRs.filter(pr => pr.state === 'closed' && !pr.merged_at).length,
          mergedCount: userPRs.filter(pr => pr.merged_at).length
        };

        stats.repos.push(repoStats);
        stats.totalPRs += repoStats.prCount;
        stats.openPRs += repoStats.openCount;
        stats.closedPRs += repoStats.closedCount;
        stats.mergedPRs += repoStats.mergedCount;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to get PR stats for ${repo}:`, errorMessage);
        // Continue with other repos even if one fails
      }
    }

    return stats;
  }

  /**
   * Get PR activity for a user in the past week
   * @param username GitHub username
   * @param repoList Array of repository names (format: "owner/repo")
   * @returns Weekly PR activity statistics
   */
  async getUserWeeklyActivity(username: string, repoList: string[]): Promise<{
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
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    const stats = {
      prsOpened: 0,
      prsReviewed: 0,
      prsMerged: 0,
      totalActivity: 0,
      repos: [] as Array<{
        repo: string;
        prsOpened: number;
        prsReviewed: number;
        prsMerged: number;
        totalRecentPRs: number;
      }>
    };

    for (const repo of repoList) {
      try {
        const [owner, repoName] = repo.split('/');
        if (!owner || !repoName) {
          this.logger.warn(`Invalid repo format: ${repo}`);
          continue;
        }

        // Get all PRs for this repo from the past week
        const allPRs = await this.getPullRequests(owner, repoName, 'all', 100);
        const recentPRs = allPRs.filter(pr => 
          new Date(pr.created_at) >= oneWeekAgo || 
          new Date(pr.updated_at) >= oneWeekAgo
        );

        // Count PRs opened by this user
        const prsOpened = recentPRs.filter(pr => 
          pr.user.login === username && 
          new Date(pr.created_at) >= oneWeekAgo
        ).length;

        // Count PRs merged by this user
        const prsMerged = recentPRs.filter(pr => 
          pr.user.login === username && 
          pr.merged_at && 
          new Date(pr.merged_at) >= oneWeekAgo
        ).length;

        // For demonstration purposes, let's also count total recent PRs in the repo
        // This gives a better sense of activity even if the user didn't open them
        const totalRecentPRs = recentPRs.length;

        // For PRs reviewed, we need to check review comments
        // This is a simplified approach - in reality, we'd need to fetch review data
        const prsReviewed = await this.getUserReviewCount(owner, repoName, username, oneWeekAgoISO);

        const repoStats = {
          repo,
          prsOpened,
          prsReviewed,
          prsMerged,
          totalRecentPRs // Add this for better visibility
        };

        stats.repos.push(repoStats);
        stats.prsOpened += prsOpened;
        stats.prsReviewed += prsReviewed;
        stats.prsMerged += prsMerged;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to get weekly activity for ${repo}:`, errorMessage);
      }
    }

    stats.totalActivity = stats.prsOpened + stats.prsReviewed + stats.prsMerged;
    return stats;
  }

  /**
   * Get review count for a user (simplified implementation)
   * In a real implementation, you'd fetch review data from GitHub API
   */
  private async getUserReviewCount(owner: string, repo: string, username: string, _since: string): Promise<number> {
    try {
      // This is a placeholder - GitHub API doesn't have a direct "reviews by user" endpoint
      // You'd need to fetch all PRs and check their reviews
      // For now, return 0 as we don't have review data easily accessible
      return 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get review count for ${username} in ${owner}/${repo}:`, errorMessage);
      return 0;
    }
  }

  /**
   * Get comprehensive user activity summary
   * @param username GitHub username
   * @param repoList Array of repository names
   * @returns Complete activity summary
   */
  async getUserActivitySummary(username: string, repoList: string[]): Promise<{
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
    // Get user info
    const user = await this.getUser(username);
    
    // Get weekly activity
    const weeklyActivity = await this.getUserWeeklyActivity(username, repoList);
    
    // Get overall PR stats
    const overallStats = await this.getUserPRStats(username, repoList);
    
    // Combine repo data
    const repos = repoList.map(repo => {
      const weeklyRepo = weeklyActivity.repos.find(r => r.repo === repo);
      const overallRepo = overallStats.repos.find(r => r.repo === repo);
      
      return {
        repo,
        weeklyActivity: weeklyRepo || { prsOpened: 0, prsReviewed: 0, prsMerged: 0 },
        overallStats: overallRepo || { prCount: 0, openCount: 0, closedCount: 0, mergedCount: 0 }
      };
    });

    return {
      user,
      weeklyActivity: {
        prsOpened: weeklyActivity.prsOpened,
        prsReviewed: weeklyActivity.prsReviewed,
        prsMerged: weeklyActivity.prsMerged,
        totalActivity: weeklyActivity.totalActivity
      },
      overallStats: {
        totalPRs: overallStats.totalPRs,
        openPRs: overallStats.openPRs,
        closedPRs: overallStats.closedPRs,
        mergedPRs: overallStats.mergedPRs
      },
      repos
    };
  }
}
