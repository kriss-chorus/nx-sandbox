export interface GitHubBaseServiceInterface {
  /**
   * Make a rate-limited request to GitHub API
   */
  makeRateLimitedRequest<T>(url: string): Promise<T>;
  
  /**
   * Get authentication status and available scopes
   */
  getAuthStatus(): Promise<{
    authenticated: boolean;
    hasToken: boolean;
    scopes: string[];
    rateLimit: {
      limit: number;
      remaining: number;
      resetTime: number;
    };
  }>;
}
