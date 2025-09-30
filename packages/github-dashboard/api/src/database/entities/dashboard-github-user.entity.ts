import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { dashboards } from './dashboard.entity';

// GitHub users to track in each dashboard
export const dashboardGithubUsers = pgTable('dashboard_github_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  githubUsername: varchar('github_username', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  // Ensure unique combination of dashboard and GitHub user
  uniqueDashboardUser: unique().on(table.dashboardId, table.githubUsername),
}));

// Export types for TypeScript
export type DashboardGithubUser = typeof dashboardGithubUsers.$inferSelect;
export type NewDashboardGithubUser = typeof dashboardGithubUsers.$inferInsert;


