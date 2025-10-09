import { pgTable, uuid, unique } from 'drizzle-orm/pg-core';
import { tierType } from './tier-type.entity';
import { feature } from './feature.entity';

export const tierTypeFeature = pgTable('tier_type_feature', {
  id: uuid('id').primaryKey().defaultRandom(),
  tierTypeId: uuid('tier_type_id').references(() => tierType.id).notNull(),
  featureId: uuid('feature_id').references(() => feature.id).notNull(),
}, (table) => ({
  uniq: unique().on(table.tierTypeId, table.featureId),
}));

export type TierTypeFeature = typeof tierTypeFeature.$inferSelect;
export type NewTierTypeFeature = typeof tierTypeFeature.$inferInsert;
