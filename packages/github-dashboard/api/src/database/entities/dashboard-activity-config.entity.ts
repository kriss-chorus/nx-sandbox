import { pgTable, uuid, boolean, timestamp, unique, foreignKey } from 'drizzle-orm/pg-core';
import { dashboards } from './dashboard.entity';
import { activityTypes } from './activity-type.entity';

// Dashboard Activity Config table - junction table linking dashboards to enabled activity types
export const dashboardActivityConfigs = pgTable('dashboard_activity_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').notNull(),
  activityTypeId: uuid('activity_type_id').notNull(),
  enabled: boolean('enabled').default(true),
  dateRangeStart: timestamp('date_range_start', { withTimezone: true }), // UTC timestamp
  dateRangeEnd: timestamp('date_range_end', { withTimezone: true }), // UTC timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  // Unique constraint to prevent duplicate configs (short name)
  uniqueDashboardActivity: unique('dac_dash_act_unique').on(table.dashboardId, table.activityTypeId),
  // Named foreign keys (short names)
  dacDashboardFk: foreignKey({
    name: 'da_dashboard_fk',
    columns: [table.dashboardId],
    foreignColumns: [dashboards.id],
  }),
  dacActivityTypeFk: foreignKey({
    name: 'dac_activity_type_fk',
    columns: [table.activityTypeId],
    foreignColumns: [activityTypes.id],
  }),
}));

// Export types for TypeScript
export type DashboardActivityConfig = typeof dashboardActivityConfigs.$inferSelect;
export type NewDashboardActivityConfig = typeof dashboardActivityConfigs.$inferInsert;
