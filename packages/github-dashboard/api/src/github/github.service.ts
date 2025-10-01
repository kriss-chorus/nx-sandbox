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
      this.logger.error(`Failed to fetch user ${username}:`, error.message);
      if (error.response?.status === 404) {
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
      this.logger.error(`Failed to fetch repos for ${username}:`, error.message);
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
      this.logger.error(`Failed to fetch PRs for ${owner}/${repo}:`, error.message);
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
        this.logger.error(`Failed to get PR stats for ${repo}:`, error.message);
        // Continue with other repos even if one fails
      }
    }

    return stats;
  }
}
