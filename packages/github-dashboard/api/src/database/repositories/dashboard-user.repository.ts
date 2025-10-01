import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { BaseRepository } from '../base.repository';
import { dashboardGithubUsers, githubUsers, DashboardGithubUser, NewDashboardGithubUser, GitHubUser } from '../entities';

@Injectable()
export class DashboardUserRepository extends BaseRepository<typeof dashboardGithubUsers> {
  constructor() {
    super(dashboardGithubUsers);
  }

  /**
   * Add a GitHub user to a dashboard
   */
  async addUserToDashboard(dashboardId: string, githubUserId: string): Promise<DashboardGithubUser> {
    const newRelation: NewDashboardGithubUser = {
      dashboardId,
      githubUserId,
    };
    
    const [relation] = await this.db
      .insert(dashboardGithubUsers)
      .values(newRelation)
      .returning();
    return relation;
  }

  /**
   * Remove a GitHub user from a dashboard
   */
  async removeUserFromDashboard(dashboardId: string, githubUserId: string): Promise<boolean> {
    const result = await this.db
      .delete(dashboardGithubUsers)
      .where(
        and(
          eq(dashboardGithubUsers.dashboardId, dashboardId),
          eq(dashboardGithubUsers.githubUserId, githubUserId)
        )
      );
    return result.rowCount > 0;
  }

  /**
   * Get all GitHub users for a dashboard with their user information
   */
  async getUsersForDashboard(dashboardId: string): Promise<(DashboardGithubUser & { user: GitHubUser })[]> {
    return this.db
      .select({
        id: dashboardGithubUsers.id,
        dashboardId: dashboardGithubUsers.dashboardId,
        githubUserId: dashboardGithubUsers.githubUserId,
        addedAt: dashboardGithubUsers.addedAt,
        user: {
          id: githubUsers.id,
          githubUserId: githubUsers.githubUserId,
          githubUsername: githubUsers.githubUsername,
          displayName: githubUsers.displayName,
          avatarUrl: githubUsers.avatarUrl,
          profileUrl: githubUsers.profileUrl,
          createdAt: githubUsers.createdAt,
          updatedAt: githubUsers.updatedAt,
        }
      })
      .from(dashboardGithubUsers)
      .innerJoin(githubUsers, eq(dashboardGithubUsers.githubUserId, githubUsers.id))
      .where(eq(dashboardGithubUsers.dashboardId, dashboardId));
  }

  /**
   * Check if a user is already in a dashboard
   */
  async isUserInDashboard(dashboardId: string, githubUserId: string): Promise<boolean> {
    const [relation] = await this.db
      .select()
      .from(dashboardGithubUsers)
      .where(
        and(
          eq(dashboardGithubUsers.dashboardId, dashboardId),
          eq(dashboardGithubUsers.githubUserId, githubUserId)
        )
      )
      .limit(1);
    return !!relation;
  }

  /**
   * Get dashboard-user relations only (without user details)
   */
  async getDashboardUserRelations(dashboardId: string): Promise<DashboardGithubUser[]> {
    return this.db
      .select()
      .from(dashboardGithubUsers)
      .where(eq(dashboardGithubUsers.dashboardId, dashboardId));
  }
}