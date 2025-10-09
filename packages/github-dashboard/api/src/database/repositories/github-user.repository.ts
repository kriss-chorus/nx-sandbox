import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../base.repository';
import { githubUser, GitHubUser, NewGitHubUser } from '../entities';
import { eq } from 'drizzle-orm';

@Injectable()
export class GitHubUserRepository extends BaseRepository<typeof githubUser> {
  constructor() {
    super(githubUser);
  }

  /**
   * Find a user by GitHub user ID
   */
  async findByGitHubUserId(githubUserId: string): Promise<GitHubUser | undefined> {
    const [user] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.githubUserId, githubUserId))
      .limit(1);
    return user;
  }

  /**
   * Find a user by GitHub username
   */
  async findByGitHubUsername(githubUsername: string): Promise<GitHubUser | undefined> {
    const [user] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.githubUsername, githubUsername))
      .limit(1);
    return user;
  }

  /**
   * Create or update a GitHub user
   * If user exists, update their information; if not, create new user
   */
  async upsertUser(userData: {
    githubUserId: string;
    githubUsername: string;
    displayName?: string;
    avatarUrl?: string;
    profileUrl?: string;
  }): Promise<GitHubUser> {
    // Try to find existing user by GitHub user ID
    const existingUser = await this.findByGitHubUserId(userData.githubUserId);
    
    if (existingUser) {
      // Update existing user
      const [updatedUser] = await this.db
        .update(this.table)
        .set({
          githubUsername: userData.githubUsername,
          displayName: userData.displayName || userData.githubUsername,
          avatarUrl: userData.avatarUrl,
          profileUrl: userData.profileUrl,
          updatedAt: new Date(),
        })
        .where(eq(this.table.id, existingUser.id))
        .returning();
      return updatedUser;
    } else {
      // Create new user
      const newUser: NewGitHubUser = {
        githubUserId: userData.githubUserId,
        githubUsername: userData.githubUsername,
        displayName: userData.displayName || userData.githubUsername,
        avatarUrl: userData.avatarUrl,
        profileUrl: userData.profileUrl,
      };
      
      const [createdUser] = await this.db
        .insert(this.table)
        .values(newUser)
        .returning();
      return createdUser;
    }
  }
}
