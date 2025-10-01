import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../base.repository';
import { dashboardActivityConfigs, DashboardActivityConfig, NewDashboardActivityConfig } from '../entities';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class DashboardActivityConfigRepository extends BaseRepository<typeof dashboardActivityConfigs> {
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
      .where(eq(this.table.dashboardId, dashboardId));
  }

  /**
   * Get enabled activity configurations for a dashboard
   */
  async getEnabledConfigs(dashboardId: string): Promise<DashboardActivityConfig[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.dashboardId, dashboardId),
          eq(this.table.enabled, true)
        )
      );
  }

  /**
   * Set activity configuration for a dashboard
   */
  async setActivityConfig(
    dashboardId: string, 
    activityTypeId: string, 
    enabled: boolean,
    dateRangeStart?: string,
    dateRangeEnd?: string
  ): Promise<DashboardActivityConfig> {
    const config: NewDashboardActivityConfig = {
      dashboardId,
      activityTypeId,
      enabled,
      dateRangeStart,
      dateRangeEnd
    };

    // Use upsert to either insert or update
    const [result] = await this.db
      .insert(this.table)
      .values(config)
      .onConflictDoUpdate({
        target: [this.table.dashboardId, this.table.activityTypeId],
        set: {
          enabled,
          dateRangeStart,
          dateRangeEnd,
          updatedAt: new Date()
        }
      })
      .returning();

    return result;
  }

  /**
   * Update multiple activity configurations for a dashboard
   */
  async updateDashboardConfigs(
    dashboardId: string,
    configs: Array<{
      activityTypeId: string;
      enabled: boolean;
      dateRangeStart?: string;
      dateRangeEnd?: string;
    }>
  ): Promise<DashboardActivityConfig[]> {
    const results: DashboardActivityConfig[] = [];

    for (const config of configs) {
      const result = await this.setActivityConfig(
        dashboardId,
        config.activityTypeId,
        config.enabled,
        config.dateRangeStart,
        config.dateRangeEnd
      );
      results.push(result);
    }

    return results;
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
   */
  async isActivityEnabled(dashboardId: string, activityTypeId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.dashboardId, dashboardId),
          eq(this.table.activityTypeId, activityTypeId),
          eq(this.table.enabled, true)
        )
      )
      .limit(1);

    return result.length > 0;
  }
}
