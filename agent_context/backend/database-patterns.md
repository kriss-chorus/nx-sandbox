# Database Patterns

## Overview

This guide covers database patterns using Drizzle ORM with PostgreSQL, including transaction management, query patterns, and best practices for data access.

## Entity Definitions

### Using Drizzle ORM for Schema

All database tables must be defined using Drizzle ORM. We do NOT create manual SQL migrations. Drizzle handles schema generation from TypeScript definitions.

```typescript
// ✅ Correct - Define entities using Drizzle
import { internalSchema, baseEntity } from '@platform/api-framework-base-tables';
import { varchar, timestamp, uuid, boolean } from '@platform/drizzle/pg-core';

export const facilityEntity = internalSchema.table('facility', {
  ...baseEntity, // Includes id, createdAt, updatedAt
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
  isActive: boolean().default(true),
});

// ❌ Wrong - Don't create SQL migrations manually
// CREATE TABLE facility (...)
```

### Lookup Tables vs Enums

Always use lookup tables instead of database enums for better flexibility and data integrity.

```typescript
// ✅ Correct - Use lookup tables
export const statusOptionEntity = internalSchema.table('status_option', {
  ...baseEntity,
  name: varchar({ length: 50 }).notNull().unique(),
  description: varchar({ length: 255 }),
});

export const recordEntity = internalSchema.table('record', {
  ...baseEntity,
  statusOptionId: uuid()
    .notNull()
    .references(() => statusOptionEntity.id),
  // other fields...
});

// ❌ Wrong - Don't use enum types
// status: pgEnum('status', ['active', 'inactive', 'pending'])
```

Benefits of lookup tables:

- Can add new options without schema changes
- Can include additional metadata (descriptions, sort order, etc.)
- Better for reporting and UI display
- Maintains referential integrity

### Seeding Lookup Tables

Always seed lookup tables using migrations with statically defined UUIDs to ensure consistency across environments.

```sql
-- ✅ Correct - Use static UUIDs and NIL UUID for system-created records
INSERT INTO status_option (id, name, created_at, updated_at, created_by_id) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'active', NOW(), NOW(), '00000000-0000-0000-0000-000000000000'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'inactive', NOW(), NOW(), '00000000-0000-0000-0000-000000000000'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'pending', NOW(), NOW(), '00000000-0000-0000-0000-000000000000');

-- ❌ Wrong - Don't use gen_random_uuid() for lookup data
INSERT INTO status_option (id, name) VALUES
  (gen_random_uuid(), 'active'),  -- This creates different IDs each time
  (gen_random_uuid(), 'inactive');
```

Benefits of static UUIDs for lookup data:

- Consistent IDs across all environments (dev, staging, prod)
- Can reference these IDs in code constants
- Easier debugging and data migration
- Prevents duplicate seeding

Use NIL UUID (`00000000-0000-0000-0000-000000000000`) for `created_by_id` to indicate system-created records.

## Entity Definitions

### Avoiding Circular Imports

Never import from the schema file in entity files to prevent circular dependencies.

```typescript
// ❌ Wrong - Don't import from schema.ts in entity files
import { knownUser } from '../../../schema';

export const roundEntity = internalSchema.table(
  'round',
  {
    startedById: uuid().notNull(),
  },
  (table) => [
    namedForeignKey({
      columns: [table.startedById],
      foreignColumns: [knownUser.id], // This causes circular dependency
    }),
  ],
);

// ✅ Correct - Reference tables by name as string
export const roundEntity = internalSchema.table('round', {
  startedById: uuid().notNull(),
});

// Foreign keys are handled at the schema level or in migrations
// The relationships can be defined in relation files or resolvers
```

When you need to reference another table:

- Use string references in migrations
- Define relations in separate relation files
- Handle joins in service/resolver layer
- Let Drizzle's schema inference handle the connections

## Entity Definition with Drizzle ORM

### Table Definition Pattern

Always use Drizzle ORM to define your database entities. Never write manual SQL for table creation:

```typescript
// ✅ Correct - Using Drizzle ORM for entity definition
import { internalSchema, baseEntity } from '@platform/api-framework-base-tables';
import { varchar, uuid, timestamp, boolean, integer } from '@platform/drizzle/pg-core';
import { namedForeignKey } from '@platform/drizzle';

export const facilityEntity = internalSchema.table(
  'facility',
  {
    ...baseEntity, // Includes id, createdAt, updatedAt, deletedAt
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 500 }),
    capacity: integer().default(0),
    isActive: boolean().default(true),
    ownerId: uuid().notNull(),
  },
  (table) => [
    // Define foreign keys
    namedForeignKey({
      columns: [table.ownerId],
      foreignColumns: [userEntity.id],
    }),
  ],
);

// ❌ Wrong - Manual SQL
// Don't write CREATE TABLE statements manually
// Don't write ALTER TABLE statements manually
```

### Entity Relationships

```typescript
// One-to-many relationship
export const buildingEntity = internalSchema.table(
  'building',
  {
    ...baseEntity,
    facilityId: uuid().notNull(),
    name: varchar({ length: 255 }).notNull(),
    floors: integer().notNull(),
  },
  (table) => [
    namedForeignKey({
      columns: [table.facilityId],
      foreignColumns: [facilityEntity.id],
    }),
  ],
);

// Many-to-many relationship
export const userFacilityEntity = internalSchema.table(
  'user_facility',
  {
    ...baseEntity,
    userId: uuid().notNull(),
    facilityId: uuid().notNull(),
    role: varchar({ length: 50 }).notNull(),
  },
  (table) => [
    namedForeignKey({
      columns: [table.userId],
      foreignColumns: [userEntity.id],
    }),
    namedForeignKey({
      columns: [table.facilityId],
      foreignColumns: [facilityEntity.id],
    }),
  ],
);
```

### Index Definition

```typescript
import { index, uniqueIndex } from '@platform/drizzle/pg-core';

export const facilityEntity = internalSchema.table(
  'facility',
  {
    ...baseEntity,
    name: varchar({ length: 255 }).notNull(),
    tenantId: uuid().notNull(),
    externalId: varchar({ length: 100 }),
  },
  (table) => [
    // Regular index
    index('idx_facility_tenant').on(table.tenantId),

    // Composite index
    index('idx_facility_tenant_name').on(table.tenantId, table.name),

    // Unique index
    uniqueIndex('idx_facility_external').on(table.externalId),

    // Partial index (use raw SQL for where clause)
    index('idx_facility_active')
      .on(table.name)
      .where(sql`deleted_at IS NULL`),
  ],
);
```

### Enum Types

```typescript
import { pgEnum } from '@platform/drizzle/pg-core';

// Define enum
export const statusEnum = pgEnum('status_enum', ['active', 'inactive', 'pending']);

// Use in entity
export const itemEntity = internalSchema.table('item', {
  ...baseEntity,
  name: varchar({ length: 255 }).notNull(),
  status: statusEnum('status').notNull().default('pending'),
});
```

## ScopedDrizzleService Usage

### Transaction Context Pattern

Always use `runWithContext` for any operation that modifies data (INSERT, UPDATE, DELETE):

```typescript
// ✅ Correct - Using runWithContext for mutations
async createEntity(input: CreateEntityInput): Promise<string> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();
  return runWithContext(async (trx) => {
    const entityId = v4();

    await trx.insert(entities).values({
      id: entityId,
      name: input.name,
      description: input.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return entityId;
  });
}

// ❌ Wrong - Using db directly for mutations
async createEntity(input: CreateEntityInput): Promise<string> {
  const { db } = await this.#dbFactory.getScopedDb();
  const entityId = v4();

  await db.insert(entities).values({ // Don't do this!
    id: entityId,
    // ...
  });

  return entityId;
}
```

### Read-Only Queries

Use `db` directly for read-only queries:

```typescript
// ✅ Correct - Using db for read queries
async getEntityById(id: string): Promise<Entity | null> {
  const { db } = await this.#dbFactory.getScopedDb();

  const result = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.id, id),
        isNull(entities.deletedAt),
      ),
    )
    .limit(1);

  return result[0] || null;
}

// Special case: Using SET LOCAL requires runWithContext
async getEntitiesWithContext(): Promise<Entity[]> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();

  return await runWithContext(async (trx) => {
    // SET LOCAL for RLS or other session settings
    await trx.execute(sql`SET LOCAL app.tenant_id = ${tenantId}`);

    return await trx
      .select()
      .from(entities)
      .where(isNull(entities.deletedAt));
  });
}
```

## Query Patterns

### Basic CRUD Operations

```typescript
// CREATE
async createBuilding(input: CreateBuildingDto): Promise<string> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();

  return await runWithContext(async (trx) => {
    const buildingId = v4();

    await trx.insert(buildings).values({
      id: buildingId,
      facilityId: input.facilityId,
      name: input.name,
      floors: input.floors,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return buildingId;
  });
}

// READ with relations
async getBuildingWithRooms(buildingId: string): Promise<BuildingWithRooms | null> {
  const { db } = await this.#dbFactory.getScopedDb();

  const result = await db
    .select({
      building: buildings,
      rooms: rooms,
    })
    .from(buildings)
    .leftJoin(rooms, eq(rooms.buildingId, buildings.id))
    .where(
      and(
        eq(buildings.id, buildingId),
        isNull(buildings.deletedAt),
      ),
    );

  if (result.length === 0) return null;

  // Group rooms by building
  const building = result[0].building;
  const roomsList = result
    .map(r => r.rooms)
    .filter(Boolean)
    .filter(room => !room.deletedAt);

  return {
    ...building,
    rooms: roomsList,
  };
}

// UPDATE
async updateBuilding(
  buildingId: string,
  input: UpdateBuildingDto,
): Promise<void> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();

  await runWithContext(async (trx) => {
    const result = await trx
      .update(buildings)
      .set({
        name: input.name,
        floors: input.floors,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(buildings.id, buildingId),
          isNull(buildings.deletedAt),
        ),
      );

    invariant(result.rowsAffected > 0, 'Building not found');
  });
}

// DELETE (soft delete)
async deleteBuilding(buildingId: string): Promise<void> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();

  await runWithContext(async (trx) => {
    await trx
      .update(buildings)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(buildings.id, buildingId),
          isNull(buildings.deletedAt),
        ),
      );
  });
}
```

### Complex Queries

```typescript
// Aggregation queries
async getFacilityStatistics(facilityId: string): Promise<FacilityStats> {
  const { db } = await this.#dbFactory.getScopedDb();

  const stats = await db
    .select({
      totalBuildings: count(buildings.id),
      totalCapacity: sum(buildings.capacity),
      avgCapacity: avg(buildings.capacity),
    })
    .from(buildings)
    .where(
      and(
        eq(buildings.facilityId, facilityId),
        isNull(buildings.deletedAt),
      ),
    )
    .groupBy(buildings.facilityId);

  return {
    totalBuildings: stats[0]?.totalBuildings || 0,
    totalCapacity: Number(stats[0]?.totalCapacity || 0),
    averageCapacity: Number(stats[0]?.avgCapacity || 0),
  };
}

// Subqueries
async getAvailableLocations(): Promise<Location[]> {
  const { db } = await this.#dbFactory.getScopedDb();

  const occupiedLocations = db
    .select({ locationId: items.locationId })
    .from(items)
    .where(isNull(items.deletedAt))
    .as('occupied');

  return await db
    .select()
    .from(locations)
    .leftJoin(occupiedLocations, eq(locations.id, occupiedLocations.locationId))
    .where(
      and(
        isNull(locations.deletedAt),
        isNull(occupiedLocations.locationId),
      ),
    );
}

// Window functions
async getRankedFacilities(): Promise<RankedFacility[]> {
  const { db } = await this.#dbFactory.getScopedDb();

  return await db
    .select({
      id: facilities.id,
      name: facilities.name,
      buildingCount: count(buildings.id),
      rank: sql<number>`ROW_NUMBER() OVER (ORDER BY COUNT(${buildings.id}) DESC)`,
    })
    .from(facilities)
    .leftJoin(buildings, eq(buildings.facilityId, facilities.id))
    .where(isNull(facilities.deletedAt))
    .groupBy(facilities.id);
}
```

### Batch Operations

```typescript
// Batch insert
async createMultipleRooms(
  buildingId: string,
  roomsData: CreateRoomDto[],
): Promise<string[]> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();

  return await runWithContext(async (trx) => {
    const roomIds = roomsData.map(() => v4());
    const now = new Date();

    await trx.insert(rooms).values(
      roomsData.map((room, index) => ({
        id: roomIds[index],
        buildingId,
        name: room.name,
        floor: room.floor,
        capacity: room.capacity,
        createdAt: now,
        updatedAt: now,
      })),
    );

    return roomIds;
  });
}

// Batch update with conditions
async updateItemStatuses(
  itemIds: string[],
  newStatus: ItemStatus,
): Promise<void> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();

  await runWithContext(async (trx) => {
    await trx
      .update(items)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(items.id, itemIds),
          isNull(items.deletedAt),
          // Only update if current status allows transition
          inArray(items.status, ['pending', 'active']),
        ),
      );
  });
}

// Batch delete with cascade
async deleteMultipleFacilities(facilityIds: string[]): Promise<void> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();

  await runWithContext(async (trx) => {
    const now = new Date();

    // Delete facilities
    await trx
      .update(facilities)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          inArray(facilities.id, facilityIds),
          isNull(facilities.deletedAt),
        ),
      );

    // Cascade delete buildings
    await trx
      .update(buildings)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          inArray(buildings.facilityId, facilityIds),
          isNull(buildings.deletedAt),
        ),
      );
  });
}
```

## Transaction Patterns

### Multi-Step Transactions

```typescript
async transferItem(
  itemId: string,
  fromLocationId: string,
  toLocationId: string,
): Promise<void> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();

  await runWithContext(async (trx) => {
    // 1. Validate item and current location
    const item = await trx
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);

    invariant(item.length > 0, 'Item not found');
    invariant(item[0].locationId === fromLocationId, 'Item not at source location');

    // 2. Check destination capacity
    const destinationCapacity = await this.#checkLocationCapacity(trx, toLocationId);
    invariant(destinationCapacity.hasSpace, 'Destination is full');

    // 3. Create transfer record
    await trx.insert(transfers).values({
      id: v4(),
      itemId,
      fromLocationId,
      toLocationId,
      transferredAt: new Date(),
      transferredBy: this.#userContext.userId,
    });

    // 4. Update item location
    await trx
      .update(items)
      .set({
        locationId: toLocationId,
        updatedAt: new Date(),
      })
      .where(eq(items.id, itemId));

    // 5. Update location statistics
    await this.updateLocationStats(trx, [fromLocationId, toLocationId]);
  });
}

async #checkLocationCapacity(
  trx: DrizzleTransaction,
  locationId: string,
): Promise<{ hasSpace: boolean; current: number; max: number }> {
  const location = await trx
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  invariant(location.length > 0, 'Location not found');

  const currentCount = await trx
    .select({ count: count() })
    .from(items)
    .where(
      and(
        eq(items.locationId, locationId),
        isNull(items.deletedAt),
      ),
    );

  return {
    hasSpace: currentCount[0].count < location[0].capacity,
    current: currentCount[0].count,
    max: location[0].capacity,
  };
}
```

### Optimistic Locking

```typescript
async updateWithOptimisticLock(
  entityId: string,
  input: UpdateInput,
  expectedVersion: number,
): Promise<void> {
  const { runWithContext } = await this.#dbFactory.getScopedDb();

  await runWithContext(async (trx) => {
    const result = await trx
      .update(entities)
      .set({
        ...input,
        version: expectedVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(entities.id, entityId),
          eq(entities.version, expectedVersion),
          isNull(entities.deletedAt),
        ),
      );

    invariant(result.rowsAffected > 0, 'Entity was modified by another user. Please refresh and try again.');
  });
}
```

## Migration Patterns

### Drizzle Schema Migrations

Drizzle automatically generates SQL migrations from your entity definitions:

```bash
# Generate migration after changing entities
pnpm nx run nhha-api:migrate:generate

# Run migrations
pnpm nx run nhha-api:migrate:run
```

## Performance Optimization

### Index Usage

```typescript
// Define indexes in schema
export const facilities = pgTable(
  'facilities',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    tenantId: varchar('tenant_id', { length: 36 }).notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    // Composite index for tenant queries
    tenantNameIdx: index('idx_facilities_tenant_name')
      .on(table.tenantId, table.name)
      .where(sql`${table.deletedAt} IS NULL`),

    // Unique constraint
    uniqueName: unique('uq_facilities_name_tenant')
      .on(table.name, table.tenantId)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);
```

### Query Optimization

```typescript
// Use EXPLAIN to analyze queries
async analyzeQuery(): Promise<void> {
  const { db } = await this.#dbFactory.getScopedDb();

  const plan = await db.execute(
    sql`EXPLAIN ANALYZE
        SELECT * FROM facilities
        WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        ORDER BY name`,
  );

  console.log('Query plan:', plan);
}

// Optimize with proper joins
async getOptimizedFacilityData(): Promise<FacilityData[]> {
  const { db } = await this.#dbFactory.getScopedDb();

  // Single query with joins instead of N+1
  return await db
    .select({
      facility: facilities,
      buildingCount: count(buildings.id),
      totalCapacity: sum(buildings.capacity),
    })
    .from(facilities)
    .leftJoin(
      buildings,
      and(
        eq(buildings.facilityId, facilities.id),
        isNull(buildings.deletedAt),
      ),
    )
    .where(isNull(facilities.deletedAt))
    .groupBy(facilities.id);
}
```

## Best Practices Summary

1. **Always use runWithContext for mutations** - Ensures transactional integrity
2. **Use db for read-only queries** - Unless SET LOCAL is needed
3. **Implement soft deletes** - Use deletedAt timestamps
4. **Avoid N+1 queries** - Use joins and batch operations
5. **Add proper indexes** - For frequently queried columns
6. **Use transactions for multi-step operations** - Maintain consistency
7. **Validate before mutating** - Check constraints and business rules
8. **Handle unique constraints** - Provide clear error messages
9. **Use batch operations** - For better performance
10. **Test with realistic data volumes** - Ensure queries scale
