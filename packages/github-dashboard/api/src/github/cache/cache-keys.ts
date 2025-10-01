/**
 * Cache key generators for GitHub data
 */

export class CacheKeys {
  /**
   * Generate cache key for PR list in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param windowDays Number of days to look back (e.g., 90 for last 90 days)
   */
  static prList(owner: string, repo: string, windowDays: number = 90): string {
    return `repo:${owner}/${repo}:prs:updated:${windowDays}d`;
  }

  /**
   * Generate cache key for reviews of a specific PR
   * @param owner Repository owner
   * @param repo Repository name
   * @param prNumber Pull request number
   */
  static prReviews(owner: string, repo: string, prNumber: number): string {
    return `repo:${owner}/${repo}:pr:${prNumber}:reviews`;
  }

  /**
   * Generate cache key for reactions of a specific PR
   * @param owner Repository owner
   * @param repo Repository name
   * @param prNumber Pull request number
   */
  static prReactions(owner: string, repo: string, prNumber: number): string {
    return `repo:${owner}/${repo}:pr:${prNumber}:reactions`;
  }

  /**
   * Generate cache key for user information
   * @param username GitHub username
   */
  static user(username: string): string {
    return `user:${username}`;
  }

  /**
   * Generate cache key for user by ID
   * @param userId GitHub user ID
   */
  static userById(userId: string): string {
    return `user:id:${userId}`;
  }

  /**
   * Generate cache key for repository information
   * @param owner Repository owner
   * @param repo Repository name
   */
  static repository(owner: string, repo: string): string {
    return `repo:${owner}/${repo}:info`;
  }

  /**
   * Generate cache key for organization repositories
   * @param orgName Organization name
   */
  static orgRepositories(orgName: string): string {
    return `org:${orgName}:repos`;
  }

  /**
   * Generate cache key for organization members
   * @param orgName Organization name
   */
  static orgMembers(orgName: string): string {
    return `org:${orgName}:members`;
  }
}
