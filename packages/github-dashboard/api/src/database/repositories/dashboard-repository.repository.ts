import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../base.repository';
import { dashboardRepository, repository, type DashboardRepository, type NewDashboardRepository, type Repository, type NewRepository } from '../entities';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class DashboardRepositoryRepository extends BaseRepository<typeof dashboardRepository> {
  constructor() {
    super(dashboardRepository);
  }

  /**
   * Add a repository to a dashboard
   */
  async addRepositoryToDashboard(dashboardId: string, name: string, githubRepoId: number): Promise<DashboardRepository> {
    const [owner, repoName] = name.split('/');
    
    // First, find or create the repository record
    let repoRecord = await this.db
      .select()
      .from(repository)
      .where(eq(repository.githubRepoId, githubRepoId))
      .limit(1);
    
    if (repoRecord.length === 0) {
      // Create new repository record
      const newRepo: NewRepository = {
        githubRepoId,
        name: repoName,
        owner,
        fullName: name,
      };
      const [createdRepo] = await this.db.insert(repository).values(newRepo).returning();
      repoRecord = [createdRepo];
    }
    
    // Now create the dashboard-repository junction
    const newDashboardRepo: NewDashboardRepository = {
      dashboardId,
      repositoryId: repoRecord[0].id,
    };
    
    const [result] = await this.db.insert(this.table).values(newDashboardRepo).returning();
    return result;
  }

  /**
   * Remove a repository from a dashboard
   */
  async removeRepositoryFromDashboard(dashboardId: string, name: string): Promise<void> {
    // First find the repository by fullName
    const repoRecord = await this.db
      .select()
      .from(repository)
      .where(eq(repository.fullName, name))
      .limit(1);
    
    if (repoRecord.length > 0) {
      await this.db
        .delete(this.table)
        .where(
          and(
            eq(this.table.dashboardId, dashboardId),
            eq(this.table.repositoryId, repoRecord[0].id)
          )
        );
    }
  }

  /**
   * Get all repositories for a dashboard
   */
  async getDashboardRepositories(dashboardId: string): Promise<string[]> {
    const repos = await this.db
      .select({ fullName: repository.fullName })
      .from(this.table)
      .innerJoin(repository, eq(this.table.repositoryId, repository.id))
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
      .innerJoin(repository, eq(this.table.repositoryId, repository.id))
      .where(eq(repository.fullName, name));
  }

  /**
   * Check if a repository is already in a dashboard
   */
  async isRepositoryInDashboard(dashboardId: string, name: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(this.table)
      .innerJoin(repository, eq(this.table.repositoryId, repository.id))
      .where(
        and(
          eq(this.table.dashboardId, dashboardId),
          eq(repository.fullName, name)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }
}
