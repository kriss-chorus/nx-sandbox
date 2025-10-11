import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

import { tierType } from '../core/tier-type.entity';

// Client/Organization (tenant)
export const client = pgTable('client', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  tierTypeId: uuid('tier_type_id').references(() => tierType.id).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Client = typeof client.$inferSelect;
export type NewClient = typeof client.$inferInsert;
