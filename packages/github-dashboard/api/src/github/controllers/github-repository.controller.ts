import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';

import { GitHubRepo, GitHubPullRequest } from '../interfaces';
import { GitHubRepositoryService } from '../services/github-repository.service';

@Controller('github/repos')
export class GitHubRepositoryController {
  constructor(private readonly githubRepositoryService: GitHubRepositoryService) {}

  /**
   * Get repository information
   * GET /api/github/repos/:owner/:repo
   */
  @Get(':owner/:repo')
  async getRepository(
    @Param('owner') owner: string,
    @Param('repo') repo: string
  ): Promise<GitHubRepo> {
    return this.githubRepositoryService.getRepository(owner, repo);
  }

  /**
   * Get pull requests for a repository
   * GET /api/github/repos/:owner/:repo/pulls?state=all&per_page=30&page=1
   */
  @Get(':owner/:repo/pulls')
  async getPullRequests(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('state') state?: 'open' | 'closed' | 'all',
    @Query('per_page') perPage?: number,
    @Query('page') page?: number
  ): Promise<GitHubPullRequest[]> {
    return this.githubRepositoryService.getPullRequests(owner, repo, state, perPage, page);
  }

  /**
   * Get pull request reviews
   * GET /api/github/repos/:owner/:repo/pulls/:pullNumber/reviews
   */
  @Get(':owner/:repo/pulls/:pullNumber/reviews')
  async getPullRequestReviews(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('pullNumber') pullNumber: number
  ): Promise<any[]> {
    return this.githubRepositoryService.getPullRequestReviews(owner, repo, pullNumber);
  }
}
