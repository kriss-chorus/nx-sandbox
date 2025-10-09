import { pgTable, uuid, unique } from 'drizzle-orm/pg-core';
import { tierTypes } from './tier-type.entity';
import { features } from './feature.entity';

export const tierTypeFeatures = pgTable('tier_type_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  tierTypeId: uuid('tier_type_id').references(() => tierTypes.id).notNull(),
  featureId: uuid('feature_id').references(() => features.id).notNull(),
}, (table) => ({
  uniq: unique().on(table.tierTypeId, table.featureId),
}));

export type TierTypeFeature = typeof tierTypeFeatures.$inferSelect;
export type NewTierTypeFeature = typeof tierTypeFeatures.$inferInsert;
