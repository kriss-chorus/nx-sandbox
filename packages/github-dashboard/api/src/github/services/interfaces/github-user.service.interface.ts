import { GitHubUser } from '../../interfaces';

export interface GitHubUserServiceInterface {
  /**
   * Get user information from GitHub API
   */
  getUser(username: string): Promise<GitHubUser>;
  
  /**
   * Get user's repositories
   */
  getUserRepos(username: string, perPage?: number, page?: number): Promise<any[]>;
  
  /**
   * Get organization members
   */
  getOrganizationMembers(orgName: string): Promise<any[]>;
  
  /**
   * Get user's weekly activity
   */
  getUserActivity(username: string, startDate?: string, endDate?: string): Promise<any>;
}
