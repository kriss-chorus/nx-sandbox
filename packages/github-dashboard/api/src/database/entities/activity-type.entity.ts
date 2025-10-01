import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// Activity Types table - lookup table for available activity types
export const activityTypes = pgTable('activity_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(), // e.g., 'prs_opened', 'pr_reviews'
  displayName: varchar('display_name', { length: 100 }).notNull(), // e.g., 'PRs Opened', 'PR Reviews'
  description: text('description'), // e.g., 'Track when team members create pull requests'
  category: varchar('category', { length: 50 }).notNull(), // e.g., 'pr_management', 'pr_review', 'general'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Export types for TypeScript
export type ActivityType = typeof activityTypes.$inferSelect;
export type NewActivityType = typeof activityTypes.$inferInsert;
