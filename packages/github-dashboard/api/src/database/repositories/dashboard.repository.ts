import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../base.repository';
import { dashboards, Dashboard, NewDashboard } from '../schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class DashboardRepository extends BaseRepository<Dashboard, NewDashboard, Partial<NewDashboard>> {
  constructor() {
    super(dashboards);
  }

  // Find dashboard by slug
  async findBySlug(slug: string): Promise<Dashboard | null> {
    try {
      const [result] = await this.db
        .select()
        .from(dashboards)
        .where(eq(dashboards.slug, slug))
        .limit(1);
      
      return result || null;
    } catch (error) {
      this.logger.error('Failed to find dashboard by slug', error);
      throw error;
    }
  }

  // Find public dashboards
  async findPublicDashboards(): Promise<Dashboard[]> {
    try {
      return await this.db
        .select()
        .from(dashboards)
        .where(eq(dashboards.isPublic, true))
        .orderBy(dashboards.createdAt);
    } catch (error) {
      this.logger.error('Failed to find public dashboards', error);
      throw error;
    }
  }

  // Update dashboard slug (useful for slug generation)
  async updateSlug(id: string, slug: string): Promise<Dashboard | null> {
    try {
      const [result] = await this.db
        .update(dashboards)
        .set({ slug, updatedAt: new Date() })
        .where(eq(dashboards.id, id))
        .returning();
      
      return result || null;
    } catch (error) {
      this.logger.error('Failed to update dashboard slug', error);
      throw error;
    }
  }
}


