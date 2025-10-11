import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../base.repository';
import { dashboardActivityConfigs, DashboardActivityConfig, NewDashboardActivityConfig } from '../entities';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class DashboardActivityConfigRepository extends BaseRepository<DashboardActivityConfig, NewDashboardActivityConfig, Partial<NewDashboardActivityConfig>> {
  constructor() {
    super(dashboardActivityConfigs);
  }

  /**
   * Get all activity configurations for a dashboard
   */
  async getDashboardConfigs(dashboardId: string): Promise<DashboardActivityConfig[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.dashboardId, dashboardId)) as DashboardActivityConfig[];
  }

  /**
   * Get enabled activity configurations for a dashboard
   * Since we removed the enabled column, all configs returned are enabled
   */
  async getEnabledConfigs(dashboardId: string): Promise<DashboardActivityConfig[]> {
    return await this.getDashboardConfigs(dashboardId);
  }

  /**
   * Add activity type to dashboard (enable it)
   */
  async addActivityTypeToDashboard(
    dashboardId: string, 
    activityTypeId: string
  ): Promise<DashboardActivityConfig> {
    const config: NewDashboardActivityConfig = {
      dashboardId,
      activityTypeId
    };

    // Insert new config (will fail if already exists due to unique constraint)
    const [result] = await this.db
      .insert(this.table)
      .values(config)
      .returning();

    return result;
  }

  /**
   * Remove activity type from dashboard (disable it)
   */
  async removeActivityTypeFromDashboard(
    dashboardId: string,
    activityTypeId: string
  ): Promise<void> {
    await this.db
      .delete(this.table)
      .where(
        and(
          eq(this.table.dashboardId, dashboardId),
          eq(this.table.activityTypeId, activityTypeId)
        )
      );
  }

  /**
   * Delete all activity configurations for a dashboard
   */
  async deleteDashboardConfigs(dashboardId: string): Promise<void> {
    await this.db
      .delete(this.table)
      .where(eq(this.table.dashboardId, dashboardId));
  }

  /**
   * Check if an activity type is enabled for a dashboard
   * Since we removed the enabled column, we just check if the config exists
   */
  async isActivityEnabled(dashboardId: string, activityTypeId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.dashboardId, dashboardId),
          eq(this.table.activityTypeId, activityTypeId)
        )
      )
      .limit(1);

    return result.length > 0;
  }
}
