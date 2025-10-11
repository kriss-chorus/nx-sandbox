import { GitHubRepo, GitHubPullRequest } from '../../interfaces';

export interface GitHubRepositoryServiceInterface {
  /**
   * Get repository information by owner and repo name
   */
  getRepository(owner: string, repo: string): Promise<GitHubRepo>;
  
  /**
   * Get pull requests for a repository
   */
  getPullRequests(
    owner: string, 
    repo: string, 
    state?: 'open' | 'closed' | 'all',
    perPage?: number,
    page?: number
  ): Promise<GitHubPullRequest[]>;
  
  /**
   * Get pull request reviews
   */
  getPullRequestReviews(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<any[]>;
}
