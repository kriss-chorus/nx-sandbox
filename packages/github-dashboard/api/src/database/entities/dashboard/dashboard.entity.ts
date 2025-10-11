import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

import { client } from '../client/client.entity';

import { dashboardTypes } from './dashboard-type.entity';

// dashboard table - stores named dashboard
export const dashboard = pgTable('dashboard', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  isPublic: boolean('is_public').default(true),
  clientId: uuid('client_id').references(() => client.id),
  dashboardTypeId: uuid('dashboard_type_id').references(() => dashboardTypes.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Export types for TypeScript
export type Dashboard = typeof dashboard.$inferSelect;
export type NewDashboard = typeof dashboard.$inferInsert;
