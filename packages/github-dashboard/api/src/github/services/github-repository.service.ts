import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GitHubRepo, GitHubPullRequest } from '../interfaces';
import { RateLimitService } from '../rate-limit.service';
import { GitHubCacheService } from '../cache/github-cache.service';
import { GitHubBaseService } from './github-base.service';
import { GitHubRepositoryServiceInterface } from './interfaces/github-repository.service.interface';

@Injectable()
export class GitHubRepositoryService extends GitHubBaseService implements GitHubRepositoryServiceInterface {
  constructor(
    httpService: HttpService,
    rateLimitService: RateLimitService,
    cacheService: GitHubCacheService
  ) {
    super(httpService, rateLimitService, cacheService);
  }

  /**
   * Get repository information by owner and repo name
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      this.logger.log(`Fetching repository: ${owner}/${repo}`);
      const url = `${this.baseUrl}/repos/${owner}/${repo}`;
      return await this.makeRateLimitedRequest<GitHubRepo>(url);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch repository ${owner}/${repo}:`, errorMessage);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.status === 404) {
          throw new HttpException(`Repository '${owner}/${repo}' not found`, HttpStatus.NOT_FOUND);
        }
        
        if (response?.status === 403) {
          throw new HttpException(`Access denied to repository '${owner}/${repo}'. Check SAML authorization.`, HttpStatus.FORBIDDEN);
        }
      }
      
      throw new HttpException('Failed to fetch repository from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get pull requests for a repository
   */
  async getPullRequests(
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'all',
    perPage = 30,
    page = 1
  ): Promise<GitHubPullRequest[]> {
    try {
      this.logger.log(`Fetching pull requests for ${owner}/${repo}`);
      const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}&page=${page}`;
      return await this.makeRateLimitedRequest<GitHubPullRequest[]>(url);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch pull requests for ${owner}/${repo}:`, errorMessage);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.status === 404) {
          throw new HttpException(`Repository '${owner}/${repo}' not found`, HttpStatus.NOT_FOUND);
        }
        
        if (response?.status === 403) {
          throw new HttpException(`Access denied to repository '${owner}/${repo}'. Check SAML authorization.`, HttpStatus.FORBIDDEN);
        }
      }
      
      throw new HttpException('Failed to fetch pull requests from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get pull request reviews
   */
  async getPullRequestReviews(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<any[]> {
    try {
      this.logger.log(`Fetching reviews for PR #${pullNumber} in ${owner}/${repo}`);
      const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;
      return await this.makeRateLimitedRequest<any[]>(url);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch reviews for PR #${pullNumber} in ${owner}/${repo}:`, errorMessage);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.status === 404) {
          throw new HttpException(`Pull request #${pullNumber} not found in ${owner}/${repo}`, HttpStatus.NOT_FOUND);
        }
        
        if (response?.status === 403) {
          throw new HttpException(`Access denied to pull request #${pullNumber} in ${owner}/${repo}. Check SAML authorization.`, HttpStatus.FORBIDDEN);
        }
      }
      
      throw new HttpException('Failed to fetch pull request reviews from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }
}
