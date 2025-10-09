import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';

// Normalized dashboard types (layout/experience)
export const dashboardTypes = pgTable('dashboard_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 32 }).notNull(),
  name: varchar('name', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueCode: unique().on(table.code),
}));

export type DashboardType = typeof dashboardTypes.$inferSelect;
export type NewDashboardType = typeof dashboardTypes.$inferInsert;
