import { pgTable, uuid, varchar, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { dashboards } from './dashboard.entity';

// Widget configuration for each dashboard
export const dashboardWidgets = pgTable('dashboard_widgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  widgetType: varchar('widget_type', { length: 100 }).notNull(),
  position: integer('position').notNull(),
  isVisible: boolean('is_visible').default(true),
  config: jsonb('config').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

// Export types for TypeScript
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type NewDashboardWidget = typeof dashboardWidgets.$inferInsert;


