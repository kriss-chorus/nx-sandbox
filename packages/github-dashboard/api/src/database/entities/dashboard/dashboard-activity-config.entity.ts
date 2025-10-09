import { pgTable, uuid, timestamp, unique, foreignKey } from 'drizzle-orm/pg-core';
import { dashboard } from './dashboard.entity';
import { activityType } from '../github/activity-type.entity';

// Dashboard Activity Config table - junction table linking dashboard to enabled activity types
// Row exists = enabled, row doesn't exist = disabled
export const dashboardActivityConfigs = pgTable('dashboard_activity_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').notNull(),
  activityTypeId: uuid('activity_type_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate configs (short name)
  uniqueDashboardActivity: unique('dac_dash_act_unique').on(table.dashboardId, table.activityTypeId),
  // Named foreign keys (short names)
  dacDashboardFk: foreignKey({
    name: 'da_dashboard_fk',
    columns: [table.dashboardId],
    foreignColumns: [dashboard.id],
  }),
  dacActivityTypeFk: foreignKey({
    name: 'dac_activity_type_fk',
    columns: [table.activityTypeId],
    foreignColumns: [activityType.id],
  }),
}));

// Export types for TypeScript
export type DashboardActivityConfig = typeof dashboardActivityConfigs.$inferSelect;
export type NewDashboardActivityConfig = typeof dashboardActivityConfigs.$inferInsert;
