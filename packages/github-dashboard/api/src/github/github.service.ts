import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { CacheKeys } from './cache/cache-keys';
import { GitHubCacheService } from './cache/github-cache.service';
import { GitHubUser, GitHubRepo, GitHubPullRequest } from './interfaces';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly baseUrl = 'https://api.github.com';
  private readonly githubToken = process.env.GITHUB_TOKEN;

  constructor(
    private readonly httpService: HttpService,
    private readonly rateLimitService: RateLimitService,
    private readonly cacheService: GitHubCacheService
  ) {
    if (this.githubToken) {
      this.logger.log('GitHub PAT configured - using authenticated requests');
    } else {
      this.logger.warn('No GitHub PAT found - using unauthenticated requests (60/hour limit)');
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
      reset: number;
    };
  }> {
    const hasToken = !!this.githubToken;
    
    if (!hasToken) {
      return {
        authenticated: false,
        hasToken: false,
        scopes: [],
        rateLimit: {
          limit: 60,
          remaining: this.rateLimitService['remaining'],
          reset: this.rateLimitService['reset']
        }
      };
    }

    try {
      // Make a test request to get scopes and rate limit info
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/user`, {
          headers: {
            'Authorization': `Bearer ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
      );

      // Update rate limit info
      this.rateLimitService.updateRateLimitInfo(response.headers);

      // Get scopes from response headers
      const scopes = response.headers['x-oauth-scopes']?.split(', ') || [];
      
      return {
        authenticated: true,
        hasToken: true,
        scopes,
        rateLimit: {
          limit: this.rateLimitService['limit'],
          remaining: this.rateLimitService['remaining'],
          reset: this.rateLimitService['reset']
        }
      };
    } catch (error) {
      this.logger.error('Failed to get auth status:', error);
      return {
        authenticated: false,
        hasToken: true,
        scopes: [],
        rateLimit: {
          limit: 60,
          remaining: 0,
          reset: Date.now() / 1000 + 3600
        }
      };
    }
  }

  /**
   * Make a rate-limited request to GitHub API
   */
  private async makeRateLimitedRequest<T>(url: string): Promise<T> {
    // Check if we can make the request
    if (!this.rateLimitService.canMakeRequest()) {
      const message = this.rateLimitService.getRateLimitMessage();
      this.logger.warn(`Rate limit exceeded: ${message}`);
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }

    try {
      // Add Authorization header if token is available
      const headers = this.githubToken ? {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      } : {
        'Accept': 'application/vnd.github.v3+json'
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { headers })
      );
      
      // Update rate limit info from response headers
      this.rateLimitService.updateRateLimitInfo(response.headers);
      
      return response.data;
    } catch (error) {
      // Update rate limit info even on error
      if (error.response?.headers) {
        this.rateLimitService.updateRateLimitInfo(error.response.headers);
      }
      throw error;
    }
  }

  /**
   * Get user information from GitHub API
   * @param username GitHub username
   * @returns User information
   */
  async getUser(username: string): Promise<GitHubUser> {
    try {
      this.logger.log(`Fetching user: ${username}`);
      return await this.makeRateLimitedRequest<GitHubUser>(`${this.baseUrl}/users/${username}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch user ${username}:`, errorMessage);
      
      // Check for rate limit issues (403 with rate limit message)
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('rate limit exceeded') ||
           errorMessage.includes('rate limit exceeded'))) {
        throw new HttpException('GitHub API rate limit exceeded. Please try again later or add authentication.', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Check for various "not found" scenarios
      if (error.response?.status === 404 || 
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
      
      // If we have a PAT, try to get all repos (including private ones)
      if (this.githubToken) {
        try {
          // First try to get user's own repos (includes private if PAT has access)
          const url = `${this.baseUrl}/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner`;
          const userRepos = await this.makeRateLimitedRequest<GitHubRepo[]>(url);
          
          // Filter to only repos owned by the requested user
          const filteredRepos = userRepos.filter(repo => repo.owner.login === username);
          if (filteredRepos.length > 0) {
            this.logger.log(`Found ${filteredRepos.length} repos (including private) for user: ${username}`);
            return filteredRepos;
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch private repos for ${username}, falling back to public repos`);
        }
      }
      
      // Fallback to public repos only
      const url = `${this.baseUrl}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`;
      const publicRepos = await this.makeRateLimitedRequest<GitHubRepo[]>(url);
      this.logger.log(`Found ${publicRepos.length} public repos for user: ${username}`);
      return publicRepos;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch repos for ${username}:`, errorMessage);
      
      // Check for rate limit issues
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('rate limit exceeded') ||
           errorMessage.includes('rate limit exceeded'))) {
        throw new HttpException('GitHub API rate limit exceeded. Please try again later or add authentication.', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Check for various "not found" scenarios
      if (error.response?.status === 404 || 
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found')) {
        throw new HttpException(`User '${username}' not found`, HttpStatus.NOT_FOUND);
      }
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
      const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}&page=${page}`;
      return await this.makeRateLimitedRequest<GitHubPullRequest[]>(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch PRs for ${owner}/${repo}:`, errorMessage);
      
      // Check for rate limit issues
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('rate limit exceeded') ||
           errorMessage.includes('rate limit exceeded'))) {
        throw new HttpException('GitHub API rate limit exceeded. Please try again later or add authentication.', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Check for various "not found" scenarios
      if (error.response?.status === 404 || 
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found')) {
        throw new HttpException(`Repository '${owner}/${repo}' not found`, HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to fetch pull requests from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get reviews for a specific pull request
   * @param owner Repository owner
   * @param repo Repository name
   * @param pullNumber Pull request number
   * @returns Array of PR reviews
   */
  async getPullRequestReviews(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<any[]> {
    try {
      this.logger.log(`Fetching reviews for ${owner}/${repo}#${pullNumber}`);
      const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;
      return await this.makeRateLimitedRequest<any[]>(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch reviews for ${owner}/${repo}#${pullNumber}:`, errorMessage);
      
      // Check for rate limit issues
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('rate limit exceeded') ||
           errorMessage.includes('rate limit exceeded'))) {
        throw new HttpException('GitHub API rate limit exceeded. Please try again later or add authentication.', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Check for various "not found" scenarios
      if (error.response?.status === 404 || 
          errorMessage.includes('404') ||
          errorMessage.includes('Not Found')) {
        throw new HttpException(`Pull request '${owner}/${repo}#${pullNumber}' not found`, HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to fetch pull request reviews from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get pull requests with reviews for multiple repositories (organization tracking)
   * @param repositories Array of repository names in format 'owner/repo'
   * @param startDate Start date for filtering PRs
   * @param endDate End date for filtering PRs
   * @returns Object with reviewer statistics
   */
  async getOrganizationReviewSummary(
    repositories: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    reviewerStats: { [reviewer: string]: { prsReviewed: number; prs: string[] } };
    totalReviews: number;
    dateRange: { start: string; end: string };
  }> {
    this.logger.log(`Fetching organization review summary for ${repositories.length} repositories`);
    this.logger.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const reviewerStats: { [reviewer: string]: { prsReviewed: number; prs: string[] } } = {};
    let totalReviews = 0;

    for (const repo of repositories) {
      const [owner, repoName] = repo.split('/');
      if (!owner || !repoName) {
        this.logger.warn(`Invalid repository format: ${repo}`);
        continue;
      }

      try {
        this.logger.log(`Processing repository: ${repo}`);
        
        // Get pull requests with extended date range to catch PRs that might have reviews in our date range
        const extendedStartDate = new Date(startDate);
        extendedStartDate.setDate(extendedStartDate.getDate() - 30);
        
        const prs = await this.getPullRequests(owner, repoName, 'all', 10, 1); // Limit to 10 PRs to avoid timeout
        this.logger.log(`Found ${prs.length} PRs in ${repo}`);

        for (const pr of prs) {
          const prCreated = new Date(pr.created_at);
          
          // Skip PRs created well before our extended date range
          if (prCreated < extendedStartDate) {
            this.logger.debug(`Skipping PR ${pr.number} - too old: ${prCreated.toISOString()}`);
            break;
          }
          
          // Skip PRs created well after our date range
          if (prCreated > new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            this.logger.debug(`Skipping PR ${pr.number} - too new: ${prCreated.toISOString()}`);
            continue;
          }

          this.logger.debug(`Processing PR ${pr.number} created at ${prCreated.toISOString()}`);

          try {
            const reviews = await this.getPullRequestReviews(owner, repoName, pr.number);
            this.logger.debug(`Found ${reviews.length} reviews for PR ${pr.number}`);
            
            for (const review of reviews) {
              if (!review.submitted_at) {
                this.logger.debug(`Skipping review - no submitted_at date`);
                continue;
              }
              
              const reviewDate = new Date(review.submitted_at);
              this.logger.debug(`Review date: ${reviewDate.toISOString()}, state: ${review.state}`);
              
              // Filter reviews by submission date and include all review types
              if (reviewDate >= startDate && reviewDate <= endDate) {
                if (['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'].includes(review.state)) {
                  const reviewer = review.user.login;
                  const prAuthor = pr.user.login;
                  
                  this.logger.debug(`Reviewer: ${reviewer}, PR Author: ${prAuthor}`);
                  
                  // Skip reviews made by the PR author and bot reviews
                  if (reviewer !== prAuthor && !reviewer.includes('[bot]')) {
                    const prIdentifier = `${repo}#${pr.number}`;
                    
                    if (!reviewerStats[reviewer]) {
                      reviewerStats[reviewer] = { prsReviewed: 0, prs: [] };
                    }
                    
                    // Only count unique PRs
                    if (!reviewerStats[reviewer].prs.includes(prIdentifier)) {
                      reviewerStats[reviewer].prs.push(prIdentifier);
                      reviewerStats[reviewer].prsReviewed++;
                      totalReviews++;
                      this.logger.log(`Added review: ${reviewer} reviewed ${prIdentifier}`);
                    }
                  } else {
                    this.logger.debug(`Skipping review - author match or bot: ${reviewer}`);
                  }
                }
              } else {
                this.logger.debug(`Review date ${reviewDate.toISOString()} outside range`);
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to fetch reviews for ${repo}#${pr.number}:`, error.message);
          }
        }
      } catch (error) {
        this.logger.error(`Error processing repository ${repo}:`, error.message);
      }
    }

    this.logger.log(`Final results: ${Object.keys(reviewerStats).length} reviewers, ${totalReviews} total reviews`);

    return {
      reviewerStats,
      totalReviews,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    };
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
   * Get emoji reactions for a pull request
   * @param owner Repository owner
   * @param repo Repository name
   * @param pullNumber Pull request number
   * @returns Array of emoji reactions
   */
  async getPullRequestReactions(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<any[]> {
    try {
      this.logger.log(`Fetching reactions for ${owner}/${repo}#${pullNumber}`);
      const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${pullNumber}/reactions`;
      return await this.makeRateLimitedRequest<any[]>(url);
    } catch (error) {
      this.logger.warn(`Failed to fetch reactions for ${owner}/${repo}#${pullNumber}:`, error);
      return [];
    }
  }

  /**
   * Get PR activity for a user within a date range
   * @param username GitHub username
   * @param repoList Array of repository names (format: "owner/repo")
   * @param startDate Start date for activity tracking (optional, defaults to 7 days ago)
   * @param endDate End date for activity tracking (optional, defaults to now)
   * @returns PR activity statistics for the specified date range
   */
  async getUserActivity(username: string, repoList: string[], startDate?: string, endDate?: string): Promise<{
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
    // Use provided date range or default to one week ago
    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDateObj = endDate ? new Date(endDate) : new Date();
    
    const startDateISO = startDateObj.toISOString().split('T')[0]; // YYYY-MM-DD format for GitHub search
    const endDateISO = endDateObj.toISOString().split('T')[0];

    this.logger.log(`🔍 Getting activity for ${username} from ${startDateISO} to ${endDateISO}`);
    this.logger.log(`📁 Repositories to check: ${repoList.join(', ')}`);

    const stats = {
      prsCreated: 0,
      prsReviewed: 0,
      prsMerged: 0,
      totalActivity: 0,
      repos: [] as Array<{
        repo: string;
        prsCreated: number;
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

        this.logger.log(`Processing repo ${repo} for user ${username} from ${startDateISO} to ${endDateISO}`);
        
        // Use GitHub Search API to find PRs created by user in date range
        this.logger.log(`🔍 Searching for PRs created by ${username} in ${owner}/${repoName}`);
        const prsCreated = await this.searchUserPRs(username, owner, repoName, 'created', startDateISO, endDateISO);
        
        // Use GitHub Search API to find PRs merged by user in date range  
        this.logger.log(`🔍 Searching for PRs merged by ${username} in ${owner}/${repoName}`);
        const prsMerged = await this.searchUserPRs(username, owner, repoName, 'merged', startDateISO, endDateISO);
        
        // For PRs reviewed, we still need to check individual PRs (GitHub search doesn't have review search)
        const prsReviewed = await this.getUserReviewCount(owner, repoName, username, startDateISO, endDateISO);

        // Get total recent PRs in repo for context
        const totalRecentPRs = await this.getTotalRecentPRs(owner, repoName, startDateISO, endDateISO);

        const repoStats = {
          repo,
          prsCreated,
          prsReviewed,
          prsMerged,
          totalRecentPRs // Add this for better visibility
        };

        stats.repos.push(repoStats);
        stats.prsCreated += prsCreated;
        stats.prsReviewed += prsReviewed;
        stats.prsMerged += prsMerged;
        stats.totalActivity += prsCreated + prsReviewed + prsMerged;

        this.logger.log(`Repo ${repo}: ${prsCreated} created, ${prsMerged} merged, ${prsReviewed} reviewed`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to get activity for ${username} in ${repo}:`, errorMessage);
      }
    }

    return stats;
  }

  /**
   * Search for PRs using GitHub Search API (much faster than fetching all PRs)
   * Uses both username and user ID to handle username changes
   * @param type 'created' = PRs created in date range, 'merged' = PRs merged in date range
   */
  private async searchUserPRs(username: string, owner: string, repo: string, type: 'created' | 'merged', startDate: string, endDate: string): Promise<number> {
    try {
      // First, get the user's GitHub ID to handle username changes
      const userInfo = await this.getUser(username);
      const userId = userInfo.id;
      
      this.logger.log(`Searching for ${type === 'created' ? 'created in date range' : 'merged in date range'} PRs for user ${username} (ID: ${userId}) in ${owner}/${repo}`);
      
      // Try search with current username first
      const searchQuery = type === 'merged' 
        ? `repo:${owner}/${repo} author:${username} is:pr is:merged merged:${startDate}..${endDate}`
        : `repo:${owner}/${repo} author:${username} is:pr created:${startDate}..${endDate}`;
      
      this.logger.log(`Searching with current username: ${searchQuery}`);
      const response = await this.makeRateLimitedRequest(`https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&per_page=1`) as any;
      
      let totalCount = 0;
      if (response && response.total_count !== undefined) {
        totalCount = response.total_count;
        this.logger.log(`Found ${totalCount} ${type} PRs with current username for ${username}`);
      }
      
      // If we found results with current username, return them
      if (totalCount > 0) {
        return totalCount;
      }
      
      // If no results with current username, try a broader search and filter by user ID
      // This handles cases where the user changed their username
      this.logger.log(`No results with current username, trying broader search for user ID ${userId}`);
      
      const broaderQuery = type === 'merged'
        ? `repo:${owner}/${repo} is:pr is:merged merged:${startDate}..${endDate}`
        : `repo:${owner}/${repo} is:pr created:${startDate}..${endDate}`;
      
      // Get more results to filter by user ID
      const broaderResponse = await this.makeRateLimitedRequest(`https://api.github.com/search/issues?q=${encodeURIComponent(broaderQuery)}&per_page=100`) as any;
      
      if (broaderResponse && broaderResponse.items) {
        // Filter results by user ID to handle username changes
        const userPRs = broaderResponse.items.filter((pr: any) => pr.user.id === userId);
        this.logger.log(`Found ${userPRs.length} ${type} PRs for user ID ${userId} (username may have changed)`);
        return userPRs.length;
      }
      
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to search for ${type} PRs for ${username} in ${owner}/${repo}:`, error);
      return 0;
    }
  }

  /**
   * Get total recent PRs in a repository for context
   */
  private async getTotalRecentPRs(owner: string, repo: string, startDate: string, endDate: string): Promise<number> {
    try {
      const searchQuery = `repo:${owner}/${repo} is:pr created:${startDate}..${endDate}`;
      this.logger.log(`Searching for total recent PRs: ${searchQuery}`);
      
      const response = await this.makeRateLimitedRequest(`https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}&per_page=1`) as any;
      
      if (response && response.total_count !== undefined) {
        return response.total_count;
      }
      
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to get total recent PRs for ${owner}/${repo}:`, error);
      return 0;
    }
  }

  /**
   * Get review count for a user using GitHub Search API
   * This searches for PRs that the user has reviewed within the date range
   * Handles username changes by using user ID for comparison
   */
  private async getUserReviewCount(owner: string, repo: string, username: string, startDate: string, endDate: string): Promise<number> {
    try {
      this.logger.log(`Getting review count for ${username} in ${owner}/${repo} from ${startDate} to ${endDate}`);
      
      // Get user info to handle username changes
      const userInfo = await this.getUser(username);
      const userId = userInfo.id;
      
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      // Get recent PRs in the repository (limit to 20 most recent to reduce API calls)
      const allPRs = await this.getPullRequests(owner, repo, 'all', 20);
      this.logger.log(`Found ${allPRs.length} total PRs in ${owner}/${repo}`);
      
      // Filter to only PRs that are not created by the user (using both username and ID) and are within date range
      const otherPRs = allPRs.filter(pr => 
        pr.user.login !== username && pr.user.id !== userId &&
        (new Date(pr.created_at) >= startDateObj || 
         new Date(pr.updated_at) >= startDateObj)
      );
      
      this.logger.log(`Checking ${otherPRs.length} PRs for reviews by ${username} (ID: ${userId}) in ${owner}/${repo}`);
      
      // Process PRs in parallel batches to avoid overwhelming the API
      const batchSize = 3; // Smaller batch size for reviews
      const reviewedPRs = new Set<number>();
      
      for (let i = 0; i < otherPRs.length; i += batchSize) {
        const batch = otherPRs.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (pr) => {
          try {
            this.logger.log(`Checking reviews and reactions for PR #${pr.number} in ${owner}/${repo}`);
            
            // Get both reviews and emoji reactions
            const [reviews, reactions] = await Promise.all([
              this.getPullRequestReviews(owner, repo, pr.number),
              this.getPullRequestReactions(owner, repo, pr.number)
            ]);
            
            this.logger.log(`Found ${reviews.length} reviews and ${reactions.length} reactions for PR #${pr.number}`);
            
            // Debug: Log all reactions found
            if (reactions.length > 0) {
              this.logger.log(`🔍 All reactions on PR #${pr.number}:`, reactions.map(r => ({
                user: r.user.login,
                userId: r.user.id,
                content: r.content,
                created_at: r.created_at
              })));
            }
            
            // Check if this user has ANY review activity on this PR within the date range
            // Use both username and user ID to handle username changes
            const hasUserReview = reviews.some(review => {
              const isUserReview = (review.user.login === username || review.user.id === userId) && review.submitted_at;
              if (isUserReview) {
                const reviewDate = new Date(review.submitted_at);
                const inRange = reviewDate >= startDateObj && reviewDate <= endDateObj;
                if (inRange) {
                  this.logger.log(`User ${username} (ID: ${userId}) reviewed PR #${pr.number} on ${review.submitted_at} (${review.state})`);
                }
                return inRange;
              }
              return false;
            });

            // Check if this user has ANY emoji reaction activity on this PR within the date range
            const hasUserReaction = reactions.some(reaction => {
              const isUserReaction = (reaction.user.login === username || reaction.user.id === userId) && reaction.created_at;
              if (isUserReaction) {
                const reactionDate = new Date(reaction.created_at);
                const inRange = reactionDate >= startDateObj && reactionDate <= endDateObj;
                this.logger.log(`🔍 Checking reaction by ${reaction.user.login} (ID: ${reaction.user.id}) on PR #${pr.number}: ${reaction.content} at ${reaction.created_at}`);
                this.logger.log(`📅 Date range: ${startDateObj.toISOString()} to ${endDateObj.toISOString()}`);
                this.logger.log(`📅 Reaction date: ${reactionDate.toISOString()}, In range: ${inRange}`);
                if (inRange) {
                  this.logger.log(`✅ User ${username} (ID: ${userId}) reacted with ${reaction.content} on PR #${pr.number} on ${reaction.created_at}`);
                }
                return inRange;
              }
              return false;
            });
            
            return (hasUserReview || hasUserReaction) ? pr.number : null;
          } catch (error) {
            this.logger.warn(`Failed to get reviews for PR ${pr.number} in ${owner}/${repo}:`, error);
            return null;
          }
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Add reviewed PRs to set
        batchResults.forEach(prNumber => {
          if (prNumber) {
            reviewedPRs.add(prNumber);
            this.logger.log(`✅ User ${username} (ID: ${userId}) reviewed PR #${prNumber} in ${owner}/${repo}`);
          }
        });
        
        // Small delay between batches to be respectful to GitHub API
        if (i + batchSize < otherPRs.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      const reviewCount = reviewedPRs.size;
      this.logger.log(`📊 User ${username} (ID: ${userId}) reviewed/reacted to ${reviewCount} unique PRs in ${owner}/${repo} from ${startDate} to ${endDate}`);
      return reviewCount;
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
  async getUserActivitySummary(username: string, repoList: string[], startDate?: string, endDate?: string): Promise<{
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
        repo: string;
        prsCreated: number;
        prsReviewed: number;
        prsMerged: number;
        totalRecentPRs: number;
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
    
    // Get activity for the specified date range
    const activity = await this.getUserActivity(username, repoList, startDate, endDate);
    
    // Get overall PR stats
    const overallStats = await this.getUserPRStats(username, repoList);
    
    // Combine repo data
    const repos = repoList.map(repo => {
      const activityRepo = activity.repos.find(r => r.repo === repo);
      const overallRepo = overallStats.repos.find(r => r.repo === repo);
      
      return {
        repo,
        activity: activityRepo || { repo, prsCreated: 0, prsReviewed: 0, prsMerged: 0, totalRecentPRs: 0 },
        overallStats: overallRepo || { prCount: 0, openCount: 0, closedCount: 0, mergedCount: 0 }
      };
    });

    return {
      user,
      activity: {
        prsCreated: activity.prsCreated,
        prsReviewed: activity.prsReviewed,
        prsMerged: activity.prsMerged,
        totalActivity: activity.totalActivity
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

  /**
   * Get organization repositories (including private ones if accessible)
   * @param orgName Organization name
   * @returns Array of repositories
   */
  async getOrganizationRepositories(orgName: string): Promise<any[]> {
    try {
      this.logger.log(`Fetching repositories for organization: ${orgName}`);
      const url = `${this.baseUrl}/orgs/${orgName}/repos?per_page=100&sort=updated`;
      return await this.makeRateLimitedRequest<any[]>(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch repositories for organization ${orgName}:`, errorMessage);
      
      if (error.response?.status === 404) {
        throw new HttpException(`Organization '${orgName}' not found`, HttpStatus.NOT_FOUND);
      }
      
      if (error.response?.status === 403) {
        throw new HttpException(`Access denied to organization '${orgName}'. Check SAML authorization.`, HttpStatus.FORBIDDEN);
      }
      
      throw new HttpException('Failed to fetch organization repositories from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get organization members (current and past)
   * @param orgName Organization name
   * @returns Array of members
   */
  async getOrganizationMembers(orgName: string): Promise<any[]> {
    try {
      this.logger.log(`Fetching members for organization: ${orgName}`);
      const url = `${this.baseUrl}/orgs/${orgName}/members?per_page=100`;
      return await this.makeRateLimitedRequest<any[]>(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch members for organization ${orgName}:`, errorMessage);
      
      if (error.response?.status === 404) {
        throw new HttpException(`Organization '${orgName}' not found`, HttpStatus.NOT_FOUND);
      }
      
      if (error.response?.status === 403) {
        throw new HttpException(`Access denied to organization '${orgName}'. Check SAML authorization.`, HttpStatus.FORBIDDEN);
      }
      
      throw new HttpException('Failed to fetch organization members from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get repository information by owner and repo name
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Repository information including ID
   */
  async getRepository(owner: string, repo: string): Promise<any> {
    try {
      this.logger.log(`Fetching repository: ${owner}/${repo}`);
      const url = `${this.baseUrl}/repos/${owner}/${repo}`;
      return await this.makeRateLimitedRequest<any>(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch repository ${owner}/${repo}:`, errorMessage);
      
      if (error.response?.status === 404) {
        throw new HttpException(`Repository '${owner}/${repo}' not found`, HttpStatus.NOT_FOUND);
      }
      
      if (error.response?.status === 403) {
        throw new HttpException(`Access denied to repository '${owner}/${repo}'. Check SAML authorization.`, HttpStatus.FORBIDDEN);
      }
      
      throw new HttpException('Failed to fetch repository from GitHub', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Get batch activity summary for multiple users by dashboard ID
   * This optimizes API calls by processing users in parallel and reusing repository data
   */
  async getBatchUserActivitySummaryByDashboard(
    dashboardId: string, 
    repos: string[] = [], 
    startDate?: string, 
    endDate?: string
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
    
    // Get dashboard users from database
    const dashboardUsersResponse = await fetch(`http://localhost:3001/api/dashboards/${dashboardId}/users`);
    if (!dashboardUsersResponse.ok) {
      throw new Error(`Failed to get dashboard users: ${dashboardUsersResponse.statusText}`);
    }
    
    const dashboardUsers = await dashboardUsersResponse.json();
    
    this.logger.log(`Found ${dashboardUsers.length} users in dashboard: ${dashboardUsers.map((du: any) => `${du.user.githubUsername} (ID: ${du.user.githubUserId})`).join(', ')}`);
    
    // Process all users in parallel for better performance
    const userPromises = dashboardUsers.map(async (dashboardUser: any) => {
      try {
        const { githubUsername, githubUserId } = dashboardUser.user;
        this.logger.log(`Getting activity for user ${githubUsername} (GitHub ID: ${githubUserId})`);
        
        // Use the GitHub user ID for more reliable searching
        return await this.getUserActivitySummary(githubUsername, repos, startDate, endDate);
      } catch (error) {
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
  }

  /**
   * Get cached and filtered activity summary for multiple users by dashboard ID
   * Uses in-memory cache to minimize GitHub API calls and filters data server-side
   * @param dashboardId Dashboard ID
   * @param repos Array of repository names (format: "owner/repo")
   * @param startDate Start date for activity tracking (optional)
   * @param endDate End date for activity tracking (optional)
   * @returns Array of user activity summaries
   */
  async getCachedBatchUserActivitySummaryByDashboard(
    dashboardId: string, 
    repos: string[] = [], 
    startDate?: string, 
    endDate?: string,
    includeReviews = true,
    usersFilter: string[] = [],
    noCache = false
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
    this.logger.log(`Getting cached batch activity summary for dashboard ${dashboardId}`);

    const startKey = startDate ? new Date(startDate).toISOString() : 'auto30d';
    const endKey = endDate ? new Date(endDate).toISOString() : 'now';
    const reposKey = (repos ?? []).join('|');
    const includeKey = includeReviews ? 'rev1' : 'rev0';
    const swrKey = `batch:${dashboardId}:${reposKey}:${startKey}:${endKey}:${includeKey}`;

    if (!noCache) {
      const cachedBatch = this.cacheService.get<any[]>(swrKey);
      if (cachedBatch) {
        this.logger.log(`SWR hit for ${swrKey}`);
        // If user filter specified, filter the cached response
        if (usersFilter && usersFilter.length > 0) {
          return cachedBatch.filter(item => usersFilter.includes(item.user.login));
        }
        return cachedBatch;
      }
    }

    // Fetch dashboard users once
    const dashboardUsersResponse = await fetch(`http://localhost:3001/api/dashboards/${dashboardId}/users`);
    if (!dashboardUsersResponse.ok) {
      throw new Error(`Failed to get dashboard users: ${dashboardUsersResponse.statusText}`);
    }
    const dashboardUsers = await dashboardUsersResponse.json();

    // Optionally filter the dashboard users by login
    const filteredDashboardUsers = (usersFilter && usersFilter.length > 0)
      ? dashboardUsers.filter((du: any) => usersFilter.includes(du.user.githubUsername))
      : dashboardUsers;

    // Load repositories from dashboard if not explicitly provided
    let repoList = repos;
    if (!repoList || repoList.length === 0) {
      this.logger.log(`No repos provided; loading repositories for dashboard ${dashboardId} from database`);
      const reposResponse = await fetch(`http://localhost:3001/api/dashboards/${dashboardId}/repositories`);
      if (reposResponse.ok) {
        const reposFromDb = await reposResponse.json();
        repoList = (Array.isArray(reposFromDb) ? reposFromDb : []).map((r: any) => typeof r === 'string' ? r : r?.name).filter(Boolean);
        this.logger.log(`Loaded ${repoList.length} repositories from dashboard`);
      } else {
        this.logger.warn(`Failed to load repositories for dashboard ${dashboardId}: ${reposResponse.statusText}`);
      }
    }

    // Short-circuit: if dashboard truly has no repos, return zeros but include profiles
    if (!repoList || repoList.length === 0) {
      this.logger.log(`Dashboard has no repositories configured. Returning zero activity for all users (including profiles).`);
      const results = await Promise.all(filteredDashboardUsers.map(async (dashboardUser: any) => {
        const { githubUsername } = dashboardUser.user;
        const profile = await this.getCachedUser(githubUsername);
        return {
          user: profile,
          activity: {
            prsCreated: 0,
            prsReviewed: 0,
            prsMerged: 0,
            totalActivity: 0,
            repos: []
          }
        };
      }));
      if (!noCache) this.cacheService.set(swrKey, results, 60 * 1000); // short TTL SWR
      return results;
    }

    this.logger.log(`Computing activity for ${filteredDashboardUsers.length} users over ${repoList.length} repos`);
    
    const userPromises = filteredDashboardUsers.map(async (dashboardUser: any) => {
      try {
        const { githubUsername } = dashboardUser.user;
        const profile = await this.getCachedUser(githubUsername);
        return await this.getCachedUserActivitySummaryWithFlags(
          profile,
          repoList,
          startDate,
          endDate,
          includeReviews
        );
      } catch (error) {
        this.logger.warn(`Failed to get cached activity for user ${dashboardUser.user.githubUsername}:`, error);
        const fallbackUser = { 
          login: dashboardUser.user.githubUsername, 
          id: parseInt(dashboardUser.user.githubUserId), 
          name: dashboardUser.user.displayName || dashboardUser.user.githubUsername 
        } as GitHubUser;
        return {
          user: fallbackUser,
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
    this.logger.log(`Cached batch activity summary completed for ${results.length} users`);

    if (!noCache) this.cacheService.set(swrKey, results, 60 * 1000); // short SWR TTL
    return results;
  }

  private async aggregateRepoActivityRepoFirst(
    owner: string,
    repo: string,
    startISO: string,
    endISO: string
  ): Promise<{ createdByUserId: Record<number, number>; mergedByUserId: Record<number, number>; totalRecentPRs: number; }> {
    const cacheKey = `repo:${owner}/${repo}:agg:${startISO}:${endISO}`;
    const cached = this.cacheService.get<{ createdByUserId: Record<number, number>; mergedByUserId: Record<number, number>; totalRecentPRs: number; }>(cacheKey);
    if (cached) return cached;

    const createdByUserId: Record<number, number> = {};
    const mergedByUserId: Record<number, number> = {};

    // Search PRs created in range (all authors)
    const createdQuery = `repo:${owner}/${repo} is:pr created:${startISO}..${endISO}`;
    const createdResp = await this.makeRateLimitedRequest(`https://api.github.com/search/issues?q=${encodeURIComponent(createdQuery)}&per_page=100`) as any;
    const createdItems: any[] = createdResp?.items ?? [];
    for (const it of createdItems) {
      const user = it.user;
      if (user?.id != null) {
        createdByUserId[user.id] = (createdByUserId[user.id] ?? 0) + 1;
      }
    }

    // Search PRs merged in range (all authors)
    const mergedQuery = `repo:${owner}/${repo} is:pr is:merged merged:${startISO}..${endISO}`;
    const mergedResp = await this.makeRateLimitedRequest(`https://api.github.com/search/issues?q=${encodeURIComponent(mergedQuery)}&per_page=100`) as any;
    const mergedItems: any[] = mergedResp?.items ?? [];
    for (const it of mergedItems) {
      const user = it.user;
      if (user?.id != null) {
        mergedByUserId[user.id] = (mergedByUserId[user.id] ?? 0) + 1;
      }
    }

    // Total recent PRs in range (regardless of author) for context
    const totalResp = await this.makeRateLimitedRequest(
      `https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${owner}/${repo} is:pr created:${startISO}..${endISO}`)}&per_page=1`
    ) as any;
    const totalRecentPRs = totalResp?.total_count ?? createdItems.length;

    const aggregated = { createdByUserId, mergedByUserId, totalRecentPRs };
    this.cacheService.set(cacheKey, aggregated, 15 * 60 * 1000);
    return aggregated;
  }

  private async getCachedUserActivitySummaryWithFlags(
    user: GitHubUser,
    repoList: string[],
    startDate?: string,
    endDate?: string,
    includeReviews = true
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
    const t0 = Date.now();
    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // default 30d
    const endDateObj = endDate ? new Date(endDate) : new Date();

    const stats = {
      prsCreated: 0,
      prsReviewed: 0,
      prsMerged: 0,
      totalActivity: 0,
      repos: [] as Array<{
        repo: string;
        prsCreated: number;
        prsReviewed: number;
        prsMerged: number;
        totalRecentPRs: number;
      }>
    };

    const startISO = startDateObj.toISOString().split('T')[0];
    const endISO = endDateObj.toISOString().split('T')[0];

    for (const repo of repoList) {
      const rStart = Date.now();
      const [owner, repoName] = repo.split('/');
      if (!owner || !repoName) {
        continue;
      }

      if (!includeReviews) {
        try {
          // Repo-first aggregation (2 searches total per repo)
          const agg = await this.aggregateRepoActivityRepoFirst(owner, repoName, startISO, endISO);
          const created = agg.createdByUserId[user.id] ?? 0;
          const merged = agg.mergedByUserId[user.id] ?? 0;

          stats.repos.push({ repo, prsCreated: created, prsReviewed: 0, prsMerged: merged, totalRecentPRs: agg.totalRecentPRs });
          stats.prsCreated += created;
          stats.prsMerged += merged;
          stats.totalActivity += created + merged;
          this.logger.log(`Repo ${repo} (agg fast): created=${created}, merged=${merged}, totalPRs=${agg.totalRecentPRs} in ${Date.now() - rStart}ms`);
          continue;
        } catch (e) {
          this.logger.warn(`Repo-first aggregation failed for ${repo}: ${e instanceof Error ? e.message : e}`);
        }
      }

      // Reviews enabled path (fallback to detailed/cached)
      const prs = await this.getCachedPRs(owner, repoName);
      const filteredPRs = this.filterPRsByUserAndDate(prs, user.id, user.login, startDateObj, endDateObj);

      const prsCreated = filteredPRs.filter(pr => 
        pr.user.id === user.id && 
        new Date(pr.created_at) >= startDateObj && 
        new Date(pr.created_at) <= endDateObj
      ).length;

      const mergedArray = filteredPRs.filter(pr => 
        pr.user.id === user.id && 
        pr.merged_at &&
        new Date(pr.merged_at) >= startDateObj && 
        new Date(pr.merged_at) <= endDateObj
      );
      const prsMergedCount = mergedArray.length;

      let prsReviewed = 0;
      prsReviewed = await this.getCachedPRsReviewed(owner, repoName, filteredPRs, user.id, user.login, startDateObj, endDateObj);

      const totalRecentPRs = filteredPRs.length;

      stats.repos.push({
        repo,
        prsCreated,
        prsReviewed,
        prsMerged: prsMergedCount,
        totalRecentPRs
      });
      stats.prsCreated += prsCreated;
      stats.prsReviewed += prsReviewed;
      stats.prsMerged += prsMergedCount;
      stats.totalActivity += prsCreated + prsReviewed + prsMergedCount;

      this.logger.log(`Repo ${repo} (with reviews): created=${prsCreated}, merged=${prsMergedCount}, reviewed=${prsReviewed}, totalPRs=${totalRecentPRs} in ${Date.now() - rStart}ms`);
    }

    this.logger.log(`User ${user.login} summary in ${Date.now() - t0}ms`);
    return { user, activity: stats };
  }

  /**
   * Get cached user information
   */
  private async getCachedUser(username: string): Promise<GitHubUser> {
    const cacheKey = CacheKeys.user(username);
    let user = this.cacheService.get<GitHubUser>(cacheKey);
    
    if (!user) {
      this.logger.log(`Cache miss for user: ${username}`);
      user = await this.getUser(username);
      this.cacheService.set(cacheKey, user, 30 * 60 * 1000); // 30 minutes
    }
    
    return user;
  }

  /**
   * Get cached PRs for a repository
   */
  private async getCachedPRs(owner: string, repo: string): Promise<GitHubPullRequest[]> {
    const cacheKey = CacheKeys.prList(owner, repo, 90); // 90 days
    let prs = this.cacheService.get<GitHubPullRequest[]>(cacheKey);
    
    if (!prs) {
      this.logger.log(`Cache miss for PRs: ${owner}/${repo}`);
      try {
        // Use direct PRs API instead of search API for better reliability
        const response = await this.makeRateLimitedRequest(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100&sort=updated&direction=desc`) as any;
        
        prs = response || [];
        this.logger.log(`Retrieved ${prs.length} PRs from GitHub API for ${owner}/${repo}`);
        this.cacheService.set(cacheKey, prs, 15 * 60 * 1000); // 15 minutes
      } catch (error) {
        this.logger.error(`Failed to fetch PRs for ${owner}/${repo}:`, error);
        prs = [];
      }
    }
    
    return prs;
  }

  /**
   * Filter PRs by user and date range
   * Include PRs that were created, merged, or updated within the date range
   */
  private filterPRsByUserAndDate(
    prs: GitHubPullRequest[], 
    userId: number, 
    username: string, 
    startDate: Date, 
    endDate: Date
  ): GitHubPullRequest[] {
    return prs.filter(pr => {
      const createdAt = new Date(pr.created_at);
      const updatedAt = new Date(pr.updated_at);
      const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;
      
      // Include PR if it was created, updated, or merged within the date range
      return (createdAt >= startDate && createdAt <= endDate) ||
             (updatedAt >= startDate && updatedAt <= endDate) ||
             (mergedAt && mergedAt >= startDate && mergedAt <= endDate);
    });
  }

  /**
   * Get cached PRs reviewed count
   */
  private async getCachedPRsReviewed(
    owner: string, 
    repo: string, 
    prs: GitHubPullRequest[], 
    userId: number, 
    username: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<number> {
    let reviewedCount = 0;
    
    // Process PRs in small batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < prs.length; i += batchSize) {
      const batch = prs.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (pr) => {
        // Skip user's own PRs
        if (pr.user.id === userId) {
          return false;
        }
        
        try {
          // Get cached reviews and reactions
          const [reviews, reactions] = await Promise.all([
            this.getCachedPRReviews(owner, repo, pr.number),
            this.getCachedPRReactions(owner, repo, pr.number)
          ]);
          
          // Check if user has any review activity within date range
          const hasReview = reviews.some(review => {
            if (review.user.id === userId && review.submitted_at) {
              const reviewDate = new Date(review.submitted_at);
              return reviewDate >= startDate && reviewDate <= endDate;
            }
            return false;
          });
          
          // Check if user has any reaction activity within date range
          const hasReaction = reactions.some(reaction => {
            if (reaction.user.id === userId && reaction.created_at) {
              const reactionDate = new Date(reaction.created_at);
              return reactionDate >= startDate && reactionDate <= endDate;
            }
            return false;
          });
          
          return hasReview || hasReaction;
        } catch (error) {
          this.logger.warn(`Failed to get reviews/reactions for PR ${pr.number}:`, error);
          return false;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      reviewedCount += batchResults.filter(Boolean).length;
      
      // Small delay between batches
      if (i + batchSize < prs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return reviewedCount;
  }

  /**
   * Get cached PR reviews
   */
  private async getCachedPRReviews(owner: string, repo: string, prNumber: number): Promise<any[]> {
    const cacheKey = CacheKeys.prReviews(owner, repo, prNumber);
    let reviews = this.cacheService.get<any[]>(cacheKey);
    
    if (!reviews) {
      this.logger.log(`Cache miss for reviews: ${owner}/${repo}#${prNumber}`);
      reviews = await this.getPullRequestReviews(owner, repo, prNumber);
      this.cacheService.set(cacheKey, reviews, 15 * 60 * 1000); // 15 minutes
    }
    
    return reviews;
  }

  /**
   * Get cached PR reactions
   */
  private async getCachedPRReactions(owner: string, repo: string, prNumber: number): Promise<any[]> {
    const cacheKey = CacheKeys.prReactions(owner, repo, prNumber);
    let reactions = this.cacheService.get<any[]>(cacheKey);
    
    if (!reactions) {
      this.logger.log(`Cache miss for reactions: ${owner}/${repo}#${prNumber}`);
      reactions = await this.getPullRequestReactions(owner, repo, prNumber);
      this.cacheService.set(cacheKey, reactions, 15 * 60 * 1000); // 15 minutes
    }
    
    return reactions;
  }
}
