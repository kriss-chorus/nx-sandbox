import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';

// Normalized tier types (e.g., basic, premium)
export const tierTypes = pgTable('tier_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 32 }).notNull(), // 'basic' | 'premium'
  name: varchar('name', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueCode: unique().on(table.code),
}));

export type TierType = typeof tierTypes.$inferSelect;
export type NewTierType = typeof tierTypes.$inferInsert;
