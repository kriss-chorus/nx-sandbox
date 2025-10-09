import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../base.repository';
import { dashboardRepositories, type DashboardRepository, type NewDashboardRepository } from '../entities';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class DashboardRepositoryRepository extends BaseRepository<typeof dashboardRepositories> {
  constructor() {
    super(dashboardRepositories);
  }

  /**
   * Add a repository to a dashboard
   */
  async addRepositoryToDashboard(dashboardId: string, name: string, githubRepoId: number): Promise<DashboardRepository> {
    const [owner, repoName] = name.split('/');
    const newRepo: NewDashboardRepository = {
      dashboardId,
      githubRepoId,
      name: repoName,
      owner,
      fullName: name,
    };
    
    const [result] = await this.db.insert(this.table).values(newRepo).returning();
    return result;
  }

  /**
   * Remove a repository from a dashboard
   */
  async removeRepositoryFromDashboard(dashboardId: string, name: string): Promise<void> {
    await this.db
      .delete(this.table)
      .where(
        and(
          eq(this.table.dashboardId, dashboardId),
          eq(this.table.fullName, name)
        )
      );
  }

  /**
   * Get all repositories for a dashboard
   */
  async getDashboardRepositories(dashboardId: string): Promise<string[]> {
    const repos = await this.db
      .select({ fullName: this.table.fullName })
      .from(this.table)
      .where(eq(this.table.dashboardId, dashboardId));
    
    return repos.map(repo => repo.fullName);
  }

  /**
   * Get all dashboards that use a specific repository
   */
  async getDashboardsByRepository(name: string): Promise<DashboardRepository[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.fullName, name));
  }

  /**
   * Check if a repository is already in a dashboard
   */
  async isRepositoryInDashboard(dashboardId: string, name: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.dashboardId, dashboardId),
          eq(this.table.fullName, name)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }
}
