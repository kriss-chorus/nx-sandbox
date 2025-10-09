import { pgTable, uuid, varchar, integer, } from 'drizzle-orm/pg-core';

// Repository table - stores unique repository information
export const repository = pgTable('repository', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubRepoId: integer('github_repo_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  owner: varchar('owner', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
});

// Export types for TypeScript
export type Repository = typeof repository.$inferSelect;
export type NewRepository = typeof repository.$inferInsert;
