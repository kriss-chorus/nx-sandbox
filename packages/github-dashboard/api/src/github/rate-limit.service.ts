import { Injectable, Logger } from '@nestjs/common';

interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  limit: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private rateLimitInfo: RateLimitInfo | null = null;
  private readonly DEFAULT_LIMIT = 60; // GitHub's default rate limit for unauthenticated requests
  private readonly DEFAULT_RESET_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Update rate limit information from GitHub API response headers
   */
  updateRateLimitInfo(headers: any): void {
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '0');
    const resetTime = parseInt(headers['x-ratelimit-reset'] || '0') * 1000; // Convert to milliseconds
    const limit = parseInt(headers['x-ratelimit-limit'] || this.DEFAULT_LIMIT.toString());

    this.rateLimitInfo = {
      remaining,
      resetTime,
      limit,
    };

    this.logger.log(`Rate limit updated: ${remaining}/${limit} remaining, resets at ${new Date(resetTime).toISOString()}`);
  }

  /**
   * Check if we can make a request without hitting rate limits
   */
  canMakeRequest(): boolean {
    if (!this.rateLimitInfo) {
      return true; // No info yet, allow request
    }

    const now = Date.now();
    
    // If reset time has passed, reset the counter
    if (now >= this.rateLimitInfo.resetTime) {
      this.rateLimitInfo.remaining = this.rateLimitInfo.limit;
      this.logger.log('Rate limit reset - allowing requests');
      return true;
    }

    return this.rateLimitInfo.remaining > 0;
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   */
  getTimeUntilReset(): number {
    if (!this.rateLimitInfo) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, this.rateLimitInfo.resetTime - now);
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Get a user-friendly message about rate limiting
   */
  getRateLimitMessage(): string {
    if (!this.rateLimitInfo) {
      return 'Rate limit information not available';
    }

    const timeUntilReset = this.getTimeUntilReset();
    const minutesUntilReset = Math.ceil(timeUntilReset / (60 * 1000));

    if (this.rateLimitInfo.remaining === 0) {
      return `Rate limit exceeded. Try again in ${minutesUntilReset} minutes. Consider adding a GitHub Personal Access Token for higher limits.`;
    }

    return `${this.rateLimitInfo.remaining}/${this.rateLimitInfo.limit} requests remaining. Resets in ${minutesUntilReset} minutes.`;
  }

  /**
   * Simulate rate limit for development/testing
   */
  simulateRateLimit(): void {
    this.rateLimitInfo = {
      remaining: 0,
      resetTime: Date.now() + (5 * 60 * 1000), // 5 minutes from now
      limit: this.DEFAULT_LIMIT,
    };
    this.logger.warn('Simulated rate limit for testing');
  }
}
