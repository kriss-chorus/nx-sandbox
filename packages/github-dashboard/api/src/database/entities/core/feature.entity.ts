import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';

export const feature = pgTable('feature', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 64 }).notNull(), // e.g., 'export', 'summary', 'type_chips', 'premium_styles'
  name: varchar('name', { length: 128 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
}, (table) => ({
  uniqueCode: unique().on(table.code),
}));

export type Feature = typeof feature.$inferSelect;
export type NewFeature = typeof feature.$inferInsert;


