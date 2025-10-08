import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { clients } from './client.entity';
import { dashboardTypes } from './dashboard-type.entity';

// Dashboards table - stores named dashboards
export const dashboards = pgTable('dashboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  isPublic: boolean('is_public').default(true),
  clientId: uuid('client_id').references(() => clients.id),
  dashboardTypeId: uuid('dashboard_type_id').references(() => dashboardTypes.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Export types for TypeScript
export type Dashboard = typeof dashboards.$inferSelect;
export type NewDashboard = typeof dashboards.$inferInsert;


