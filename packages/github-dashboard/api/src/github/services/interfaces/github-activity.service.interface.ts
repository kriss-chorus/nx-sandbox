export interface GitHubActivityServiceInterface {
  /**
   * Get batch activity summary for multiple users by dashboard ID
   */
  getBatchUserActivitySummary(
    dashboardId: string,
    repos: string[],
    startDate?: string,
    endDate?: string,
    includeReviews?: boolean,
    users?: string[],
    bypassCache?: boolean
  ): Promise<any>;
  
  /**
   * Get cached batch user activity summary
   */
  getCachedBatchUserActivitySummary(
    dashboardId: string,
    repos?: string[],
    startDate?: string,
    endDate?: string,
    includeReviews?: boolean,
    users?: string[],
    bypassCache?: boolean
  ): Promise<any>;
  
  /**
   * Get PR statistics for a user across multiple repositories
   */
  getUserPRStats(username: string, repos: string[]): Promise<any>;
}
