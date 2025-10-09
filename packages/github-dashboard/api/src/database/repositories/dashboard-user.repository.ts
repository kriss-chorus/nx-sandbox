import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { BaseRepository } from '../base.repository';
import { dashboardGithubUser, githubUser, DashboardGithubUser, NewDashboardGithubUser, GitHubUser } from '../entities';

@Injectable()
export class DashboardUserRepository extends BaseRepository<typeof dashboardGithubUser> {
  constructor() {
    super(dashboardGithubUser);
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
      .insert(dashboardGithubUser)
      .values(newRelation)
      .returning();
    return relation;
  }

  /**
   * Remove a GitHub user from a dashboard
   */
  async removeUserFromDashboard(dashboardId: string, githubUserId: string): Promise<boolean> {
    const result = await this.db
      .delete(dashboardGithubUser)
      .where(
        and(
          eq(dashboardGithubUser.dashboardId, dashboardId),
          eq(dashboardGithubUser.githubUserId, githubUserId)
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
        id: dashboardGithubUser.id,
        dashboardId: dashboardGithubUser.dashboardId,
        githubUserId: dashboardGithubUser.githubUserId,
        addedAt: dashboardGithubUser.addedAt,
        user: {
          id: githubUser.id,
          githubUserId: githubUser.githubUserId,
          githubUsername: githubUser.githubUsername,
          displayName: githubUser.displayName,
          avatarUrl: githubUser.avatarUrl,
          profileUrl: githubUser.profileUrl,
          createdAt: githubUser.createdAt,
          updatedAt: githubUser.updatedAt,
        }
      })
      .from(dashboardGithubUser)
      .innerJoin(githubUser, eq(dashboardGithubUser.githubUserId, githubUser.id))
      .where(eq(dashboardGithubUser.dashboardId, dashboardId));
  }

  /**
   * Check if a user is already in a dashboard
   */
  async isUserInDashboard(dashboardId: string, githubUserId: string): Promise<boolean> {
    const [relation] = await this.db
      .select()
      .from(dashboardGithubUser)
      .where(
        and(
          eq(dashboardGithubUser.dashboardId, dashboardId),
          eq(dashboardGithubUser.githubUserId, githubUserId)
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
      .from(dashboardGithubUser)
      .where(eq(dashboardGithubUser.dashboardId, dashboardId));
  }
}