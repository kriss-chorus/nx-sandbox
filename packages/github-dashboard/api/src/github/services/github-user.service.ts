import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { GitHubCacheService } from '../cache/github-cache.service';
import { GitHubUser } from '../interfaces';
import { RateLimitService } from '../rate-limit.service';

import { GitHubBaseService } from './github-base.service';
import { GitHubUserServiceInterface } from './interfaces/github-user.service.interface';

@Injectable()
export class GitHubUserService extends GitHubBaseService implements GitHubUserServiceInterface {
  constructor(
    httpService: HttpService,
    rateLimitService: RateLimitService,
    cacheService: GitHubCacheService
  ) {
    super(httpService, rateLimitService, cacheService);
  }

  /**
   * Get user information from GitHub API
   */
  async getUser(username: string): Promise<GitHubUser> {
    try {
      this.logger.log(`Fetching user: ${username}`);
      return await this.makeRateLimitedRequest<GitHubUser>(`${this.baseUrl}/users/${username}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch user ${username}:`, errorMessage);
      
      // Check for rate limit issues (403 with rate limit message)
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.status === 403 && 
            (response?.data?.message?.includes('rate limit exceeded') ||
             errorMessage.includes('rate limit exceeded'))) {
          throw new HttpException('GitHub API rate limit exceeded. Please try again later or add authentication.', HttpStatus.TOO_MANY_REQUESTS);
        }
        
        // Check for various "not found" scenarios
        if (response?.status === 404 || 
            errorMessage.includes('404') ||
            errorMessage.includes('Not Found')) {
          throw new HttpException(`User '${username}' not found`, HttpStatus.NOT_FOUND);
        }
      }
      throw new HttpException('Failed to fetch user from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get user's repositories
   */
  async getUserRepos(username: string, perPage = 30, page = 1): Promise<any[]> {
    try {
      this.logger.log(`Fetching repositories for user: ${username}`);
      const url = `${this.baseUrl}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`;
      return await this.makeRateLimitedRequest<any[]>(url);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch repositories for user ${username}:`, errorMessage);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.status === 404) {
          throw new HttpException(`User '${username}' not found`, HttpStatus.NOT_FOUND);
        }
        
        if (response?.status === 403) {
          throw new HttpException(`Access denied to user '${username}' repositories. Check SAML authorization.`, HttpStatus.FORBIDDEN);
        }
      }
      
      throw new HttpException('Failed to fetch user repositories from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(orgName: string): Promise<any[]> {
    try {
      this.logger.log(`Fetching organization members: ${orgName}`);
      const url = `${this.baseUrl}/orgs/${orgName}/members`;
      return await this.makeRateLimitedRequest<any[]>(url);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch organization members for ${orgName}:`, errorMessage);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.status === 404) {
          throw new HttpException(`Organization '${orgName}' not found`, HttpStatus.NOT_FOUND);
        }
        
        if (response?.status === 403) {
          throw new HttpException(`Access denied to organization '${orgName}'. Check SAML authorization.`, HttpStatus.FORBIDDEN);
        }
      }
      
      throw new HttpException('Failed to fetch organization members from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get user's weekly activity
   */
  async getUserActivity(username: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      this.logger.log(`Fetching activity for user: ${username}`);
      let url = `${this.baseUrl}/users/${username}/events`;
      
      if (startDate && endDate) {
        url += `?since=${startDate}&until=${endDate}`;
      }
      
      return await this.makeRateLimitedRequest<any[]>(url);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch activity for user ${username}:`, errorMessage);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        if (response?.status === 404) {
          throw new HttpException(`User '${username}' not found`, HttpStatus.NOT_FOUND);
        }
      }
      
      throw new HttpException('Failed to fetch user activity from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }
}
