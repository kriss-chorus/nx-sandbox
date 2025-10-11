import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { GitHubCacheService } from '../cache/github-cache.service';
import { RateLimitService } from '../rate-limit.service';

import { GitHubBaseServiceInterface } from './interfaces/github-base.service.interface';

@Injectable()
export class GitHubBaseService implements GitHubBaseServiceInterface {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly baseUrl = 'https://api.github.com';
  protected readonly githubToken = process.env.GITHUB_TOKEN;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly rateLimitService: RateLimitService,
    protected readonly cacheService: GitHubCacheService
  ) {
    if (this.githubToken) {
      this.logger.log('GitHub PAT configured - using authenticated requests');
    } else {
      this.logger.warn('No GitHub PAT found - using unauthenticated requests (60/hour limit)');
    }
  }

  /**
   * Make a rate-limited request to GitHub API
   */
  async makeRateLimitedRequest<T>(url: string): Promise<T> {
    try {
      // Check rate limits before making request
      if (!this.rateLimitService.canMakeRequest()) {
        throw new Error('Rate limit exceeded');
      }
      
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Dashboard-API'
      };

      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }

      const response = await firstValueFrom(
        this.httpService.get<T>(url, { headers })
      );

      // Update rate limit info from response headers
      this.rateLimitService.updateRateLimitInfo(response.headers);
      
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`GitHub API request failed for ${url}:`, errorMessage);
      
      // Update rate limit info from error response headers if available
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.headers) {
          this.rateLimitService.updateRateLimitInfo(response.headers);
        }
      }
      throw error;
    }
  }

  /**
   * Get authentication status and available scopes
   */
  async getAuthStatus(): Promise<{
    authenticated: boolean;
    hasToken: boolean;
    scopes: string[];
    rateLimit: {
      limit: number;
      remaining: number;
      resetTime: number;
    };
  }> {
    try {
      const response = await this.makeRateLimitedRequest<any>(`${this.baseUrl}/user`);
      
      return {
        authenticated: true,
        hasToken: !!this.githubToken,
        scopes: response.headers?.['x-oauth-scopes']?.split(', ') || [],
        rateLimit: this.rateLimitService.getRateLimitStatus() || { limit: 60, remaining: 60, resetTime: Date.now() }
      };
    } catch (error) {
      return {
        authenticated: false,
        hasToken: !!this.githubToken,
        scopes: [],
        rateLimit: this.rateLimitService.getRateLimitStatus() || { limit: 60, remaining: 60, resetTime: Date.now() }
      };
    }
  }
}
