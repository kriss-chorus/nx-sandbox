import { pgTable, uuid, varchar, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { dashboards } from './dashboard.entity';
import { activityTypes } from './activity-type.entity';

// Dashboard Activity Config table - junction table linking dashboards to enabled activity types
export const dashboardActivityConfigs = pgTable('dashboard_activity_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').notNull().references(() => dashboards.id, { onDelete: 'cascade' }),
  activityTypeId: uuid('activity_type_id').notNull().references(() => activityTypes.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').default(true),
  dateRangeStart: varchar('date_range_start', { length: 10 }), // YYYY-MM-DD format
  dateRangeEnd: varchar('date_range_end', { length: 10 }), // YYYY-MM-DD format
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate configs
  uniqueDashboardActivity: unique('dashboard_activity_configs_dashboard_id_activity_type_id_unique').on(table.dashboardId, table.activityTypeId),
}));

// Export types for TypeScript
export type DashboardActivityConfig = typeof dashboardActivityConfigs.$inferSelect;
export type NewDashboardActivityConfig = typeof dashboardActivityConfigs.$inferInsert;
