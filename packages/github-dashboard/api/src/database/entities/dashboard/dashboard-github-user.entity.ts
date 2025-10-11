import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';

import { githubUser } from '../github/github-user.entity';

import { dashboard } from './dashboard.entity';

// Junction table for many-to-many relationship between dashboard and GitHub users
export const dashboardGithubUser = pgTable('dashboard_github_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id').references(() => dashboard.id, { onDelete: 'cascade' }).notNull(),
  githubUserId: uuid('github_user_id').references(() => githubUser.id, { onDelete: 'cascade' }).notNull(),
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  // Ensure unique combination of dashboard and GitHub user
  uniqueDashboardUser: unique().on(table.dashboardId, table.githubUserId),
}));

// Export types for TypeScript
export type DashboardGithubUser = typeof dashboardGithubUser.$inferSelect;
export type NewDashboardGithubUser = typeof dashboardGithubUser.$inferInsert;
