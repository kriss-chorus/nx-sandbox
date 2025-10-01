import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GitHubUser, GitHubRepo, GitHubPullRequest } from './interfaces';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly baseUrl = 'https://api.github.com';
  private readonly githubToken = process.env.GITHUB_TOKEN;

  constructor(
    private readonly httpService: HttpService,
    private readonly rateLimitService: RateLimitService
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
}
