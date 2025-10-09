import { pgTable, uuid, varchar, timestamp, integer, unique } from 'drizzle-orm/pg-core';
import { dashboards } from './dashboard.entity';

// Dashboard Repositories junction table - many-to-many relationship
export const dashboardRepositories = pgTable('dashboard_repository', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').notNull().references(() => dashboards.id, { onDelete: 'cascade' }),
  githubRepoId: integer('github_repo_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  owner: varchar('owner', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate dashboard-repo combinations
  uniqueDashboardRepo: unique('dashboard_repositories_dashboard_id_github_repo_id_unique').on(table.dashboardId, table.githubRepoId),
}));

// Export types for TypeScript
export type DashboardRepository = typeof dashboardRepositories.$inferSelect;
export type NewDashboardRepository = typeof dashboardRepositories.$inferInsert;