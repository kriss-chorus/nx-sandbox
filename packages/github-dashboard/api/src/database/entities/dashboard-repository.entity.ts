import { pgTable, uuid, varchar, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { dashboards } from './dashboard.entity';

// Tracked repositories for each dashboard
export const dashboardRepositories = pgTable('dashboard_repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  githubRepoId: integer('github_repo_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  owner: varchar('owner', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  // Ensure unique combination of dashboard and repository
  uniqueDashboardRepo: unique().on(table.dashboardId, table.githubRepoId),
}));

// Export types for TypeScript
export type DashboardRepository = typeof dashboardRepositories.$inferSelect;
export type NewDashboardRepository = typeof dashboardRepositories.$inferInsert;


