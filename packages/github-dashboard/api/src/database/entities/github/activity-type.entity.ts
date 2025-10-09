import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// Activity Types table - lookup table for available activity types
export const activityTypes = pgTable('activity_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('name', { length: 100 }).notNull().unique(), // e.g., 'prs_opened', 'pr_reviews'
  displayName: varchar('display_name', { length: 100 }).notNull(), // e.g., 'PRs Opened', 'PR Reviews'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Export types for TypeScript
export type ActivityType = typeof activityTypes.$inferSelect;
export type NewActivityType = typeof activityTypes.$inferInsert;
