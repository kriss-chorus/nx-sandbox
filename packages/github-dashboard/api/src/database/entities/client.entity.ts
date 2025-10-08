import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { tierTypes } from './tier-type.entity';

// Client/Organization (tenant)
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  tierTypeId: uuid('tier_type_id').references(() => tierTypes.id).notNull(),
  iconUrl: varchar('icon_url', { length: 500 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;


