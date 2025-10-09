import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

// GitHub users table - stores unique user information
export const githubUsers = pgTable('github_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubUserId: varchar('github_user_id', { length: 50 }).notNull().unique(), // GitHub user ID (immutable)
  githubUsername: varchar('github_username', { length: 255 }).notNull(), // Current username (for display)
  displayName: varchar('display_name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  profileUrl: varchar('profile_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Export types for TypeScript
export type GitHubUser = typeof githubUsers.$inferSelect;
export type NewGitHubUser = typeof githubUsers.$inferInsert;
