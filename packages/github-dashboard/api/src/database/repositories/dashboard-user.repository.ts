import { eq, and } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { dashboardGithubUsers, DashboardGithubUser, NewDashboardGithubUser } from '../entities';

export class DashboardUserRepository extends BaseRepository {
  /**
   * Add a GitHub user to a dashboard
   */
  async addUserToDashboard(data: NewDashboardGithubUser): Promise<DashboardGithubUser> {
    const [user] = await this.db
      .insert(dashboardGithubUsers)
      .values(data)
      .returning();
    return user;
  }

  /**
   * Remove a GitHub user from a dashboard
   */
  async removeUserFromDashboard(dashboardId: string, githubUsername: string): Promise<boolean> {
    const result = await this.db
      .delete(dashboardGithubUsers)
      .where(
        and(
          eq(dashboardGithubUsers.dashboardId, dashboardId),
          eq(dashboardGithubUsers.githubUsername, githubUsername)
        )
      );
    return result.rowCount > 0;
  }

  /**
   * Get all GitHub users for a dashboard
   */
  async getUsersForDashboard(dashboardId: string): Promise<DashboardGithubUser[]> {
    return this.db
      .select()
      .from(dashboardGithubUsers)
      .where(eq(dashboardGithubUsers.dashboardId, dashboardId));
  }

  /**
   * Check if a user is already in a dashboard
   */
  async isUserInDashboard(dashboardId: string, githubUsername: string): Promise<boolean> {
    const [user] = await this.db
      .select()
      .from(dashboardGithubUsers)
      .where(
        and(
          eq(dashboardGithubUsers.dashboardId, dashboardId),
          eq(dashboardGithubUsers.githubUsername, githubUsername)
        )
      )
      .limit(1);
    return !!user;
  }

  /**
   * Update user display name in dashboard
   */
  async updateUserDisplayName(
    dashboardId: string, 
    githubUsername: string, 
    displayName: string
  ): Promise<DashboardGithubUser | null> {
    const [user] = await this.db
      .update(dashboardGithubUsers)
      .set({ displayName })
      .where(
        and(
          eq(dashboardGithubUsers.dashboardId, dashboardId),
          eq(dashboardGithubUsers.githubUsername, githubUsername)
        )
      )
      .returning();
    return user || null;
  }
}
