import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';

// Normalized tier type (e.g., basic, premium)
export const tierType = pgTable('tier_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 32 }).notNull(), // 'basic' | 'premium'
  name: varchar('name', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueCode: unique().on(table.code),
}));

export type TierType = typeof tierType.$inferSelect;
export type NewTierType = typeof tierType.$inferInsert;
