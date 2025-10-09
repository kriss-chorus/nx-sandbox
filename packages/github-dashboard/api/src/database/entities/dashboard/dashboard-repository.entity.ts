import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { dashboard } from './dashboard.entity';
import { repository } from '../github/repository.entity';

// Dashboard Repositories junction table - many-to-many relationship
export const dashboardRepository = pgTable('dashboard_repository', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').notNull().references(() => dashboard.id, { onDelete: 'cascade' }),
  repositoryId: uuid('repository_id').notNull().references(() => repository.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  owner: varchar('owner', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate dashboard-repo combinations
  uniqueDashboardRepo: unique('dr_dashboard_id_repository_id_unique').on(table.dashboardId, table.repositoryId),
}));

// Export types for TypeScript
export type DashboardRepository = typeof dashboardRepository.$inferSelect;
export type NewDashboardRepository = typeof dashboardRepository.$inferInsert;
