import { pgTable, uuid, varchar, jsonb, timestamp, unique } from 'drizzle-orm/pg-core';

// Normalized dashboard types (layout/experience)
export const dashboardTypes = pgTable('dashboard_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 32 }).notNull(), // 'user_activity' | 'team_overview' | 'project_focus'
  name: varchar('name', { length: 64 }).notNull(),
  layoutConfig: jsonb('layout_config').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueCode: unique().on(table.code),
}));

export type DashboardType = typeof dashboardTypes.$inferSelect;
export type NewDashboardType = typeof dashboardTypes.$inferInsert;


