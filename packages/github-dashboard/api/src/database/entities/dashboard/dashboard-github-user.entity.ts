import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { dashboards } from './dashboard.entity';
import { githubUsers } from '../github/github-user.entity';

// Junction table for many-to-many relationship between dashboards and GitHub users
export const dashboardGithubUsers = pgTable('dashboard_github_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  githubUserId: uuid('github_user_id').references(() => githubUsers.id, { onDelete: 'cascade' }).notNull(),
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  // Ensure unique combination of dashboard and GitHub user
  uniqueDashboardUser: unique().on(table.dashboardId, table.githubUserId),
}));

// Export types for TypeScript
export type DashboardGithubUser = typeof dashboardGithubUsers.$inferSelect;
export type NewDashboardGithubUser = typeof dashboardGithubUsers.$inferInsert;
