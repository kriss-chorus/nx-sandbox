# NestJS Patterns

## Overview

This guide covers NestJS patterns used in our backend services, including service structure, dependency injection, DTOs, and best practices.

## Service Structure

### Basic Service Pattern

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ScopedDrizzleService } from '@platform/nestjs-db';

@Injectable({ scope: Scope.REQUEST })
export class FacilityService {
  // Use hard-private fields for injected dependencies
  readonly #drizzle: ScopedDrizzleService;
  readonly #notificationService: NotificationService;

  constructor(@Inject(SCOPED_DB_SERVICE_TOKEN) drizzle: ScopedDrizzleService, notificationService: NotificationService) {
    this.#drizzle = drizzle;
    this.#notificationService = notificationService;
  }

  async createFacility(input: CreateFacilityInput): Promise<string> {
    // Use runWithContext for all mutations
    return await this.#drizzle.runWithContext(async (trx) => {
      const facilityId = input.id || v4();

      await trx.insert(facilities).values({
        id: facilityId,
        name: input.name,
        description: input.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return facilityId;
    });
  }

  async getFacilities(): Promise<Facility[]> {
    // Use db for read-only queries
    const { db } = this.#drizzle;

    return await db.select().from(facilities).where(isNull(facilities.deletedAt)).orderBy(facilities.name);
  }
}
```

## Dependency Injection

### Hard-Private Fields Pattern

Always use hard-private fields with `#` prefix for injected services:

```typescript
// ✅ Correct - Hard-private fields
@Injectable()
export class BuildingService {
  readonly #drizzle: ScopedDrizzleService;
  readonly #facilityService: FacilityService;
  readonly #logger: Logger;

  constructor(@Inject(SCOPED_DB_SERVICE_TOKEN) drizzle: ScopedDrizzleService, facilityService: FacilityService, @Inject(LOGGER_TOKEN) logger: Logger) {
    this.#drizzle = drizzle;
    this.#facilityService = facilityService;
    this.#logger = logger;
  }
}

// ❌ Wrong - Public or private fields
@Injectable()
export class BadService {
  constructor(
    private drizzle: ScopedDrizzleService, // Don't use private
    public facilityService: FacilityService, // Don't use public
  ) {}
}
```

### Scoped Services

For request-scoped services:

```typescript
@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
  readonly #request: Request;

  constructor(@Inject(REQUEST) request: Request) {
    this.#request = request;
  }

  getCurrentUserId(): string {
    return this.#request.user?.id;
  }
}
```

## DTOs and Input Types

### Separate DTOs from GraphQL Types

Keep internal DTOs separate from GraphQL input types:

```typescript
// facility.args.ts - GraphQL input types
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateFacilityInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  capacity?: number;
}

// facility.dto.ts - Internal DTOs
export class CreateFacilityDto {
  name: string;
  description?: string;
  capacity?: number;
  createdBy: string; // Added internally
  tenantId: string;  // Added from context
}

// Service uses internal DTO
async createFacility(input: CreateFacilityDto): Promise<string> {
  // Implementation
}
```

### Input Validation

Use class-validator for input validation:

```typescript
import { IsString, IsOptional, Min, Max, IsUUID } from 'class-validator';

@InputType()
export class UpdateBuildingInput {
  @Field()
  @IsUUID()
  buildingId: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(1000)
  capacity?: number;
}
```

## Database Patterns

### Important: getScopedDb Usage

The `getScopedDb()` method returns `{ db, runWithContext }`, not a direct database instance:

```typescript
// ✅ Correct - Destructure the return value
async getFacilities(): Promise<Facility[]> {
  const { db } = await this.#drizzle.getScopedDb();

  return await db
    .select()
    .from(facilities)
    .where(isNull(facilities.deletedAt))
    .orderBy(facilities.name);
}

// ✅ Correct - Use runWithContext from getScopedDb
async createFacility(input: CreateFacilityInput): Promise<string> {
  const { runWithContext } = await this.#drizzle.getScopedDb();

  return await runWithContext(async (trx) => {
    const facilityId = v4();

    await trx.insert(facilities).values({
      id: facilityId,
      name: input.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return facilityId;
  });
}

// ❌ Wrong - getScopedDb is not the db instance
async getFacilities(): Promise<Facility[]> {
  const db = await this.#drizzle.getScopedDb();

  return await db.select().from(facilities); // Error: db is not a database instance
}
```

### Transaction Management

Always use `runWithContext` for mutations:

```typescript
async updateFacilityWithBuildings(
  facilityId: string,
  input: UpdateFacilityInput,
): Promise<void> {
  const { runWithContext } = await this.#drizzle.getScopedDb();

  await runWithContext(async (trx) => {
    // Update facility
    await trx
      .update(facilities)
      .set({
        name: input.name,
        description: input.description,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(facilities.id, facilityId),
          isNull(facilities.deletedAt),
        ),
      );

    // Update related buildings if needed
    if (input.buildingUpdates) {
      for (const buildingUpdate of input.buildingUpdates) {
        await trx
          .update(buildings)
          .set({
            name: buildingUpdate.name,
            updatedAt: new Date(),
          })
          .where(eq(buildings.id, buildingUpdate.id));
      }
    }
  });
}
```

### Batch Operations

Avoid N+1 queries by using batch operations:

```typescript
// ❌ Wrong - N+1 query pattern
async updateMultipleRecords(updates: UpdateData[]) {
  const { runWithContext } = await this.#drizzle.getScopedDb();

  for (const update of updates) {
    await runWithContext(async (trx) => {
      await trx
        .update(records)
        .set({ status: update.status })
        .where(eq(records.id, update.id));
    });
  }
}

// ✅ Correct - Single batch update
async updateMultipleRecords(updates: UpdateData[]) {
  const { runWithContext } = await this.#drizzle.getScopedDb();

  await runWithContext(async (trx) => {
    const ids = updates.map(u => u.id);

    await trx
      .update(records)
      .set({
        status: 'updated',
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(records.id, ids),
          isNull(records.deletedAt),
        ),
      );
  });
}
```

### Soft Deletes

Always implement soft deletes:

```typescript
async deleteFacility(facilityId: string): Promise<void> {
  const { runWithContext } = await this.#drizzle.getScopedDb();

  await runWithContext(async (trx) => {
    // Soft delete the facility
    await trx
      .update(facilities)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(facilities.id, facilityId),
          isNull(facilities.deletedAt),
        ),
      );

    // Cascade soft delete to buildings
    await trx
      .update(buildings)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(buildings.facilityId, facilityId),
          isNull(buildings.deletedAt),
        ),
      );
  });
}
```

## Business Logic Validation

### Using Invariant

Use invariant for validation with clear error messages:

```typescript
import { invariant } from '@platform/common-utils';

async assignItemToLocation(
  itemId: string,
  locationId: string,
): Promise<void> {
  const { runWithContext } = await this.#drizzle.getScopedDb();

  await runWithContext(async (trx) => {
    // Validate item exists
    const item = await trx
      .select()
      .from(items)
      .where(
        and(
          eq(items.id, itemId),
          isNull(items.deletedAt),
        ),
      )
      .limit(1);

    invariant(item.length > 0, 'Item not found');
    invariant(!item[0].locationId, 'Item is already assigned');

    // Validate location capacity
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

    invariant(
      currentCount[0].count < location[0].capacity,
      'Location is at full capacity',
    );

    // Perform assignment
    await trx
      .update(items)
      .set({
        locationId,
        assignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(items.id, itemId));
  });
}
```

## Error Handling

### Service Error Pattern

```typescript
export class FacilityService {
  async updateFacilityCapacity(facilityId: string, newCapacity: number): Promise<void> {
    try {
      await this.#drizzle.runWithContext(async (trx) => {
        // Check current usage
        const currentUsage = await trx
          .select({ count: count() })
          .from(buildings)
          .where(and(eq(buildings.facilityId, facilityId), isNull(buildings.deletedAt)));

        if (currentUsage[0].count > newCapacity) {
          throw new BadRequestException(`Cannot reduce capacity below current usage of ${currentUsage[0].count}`);
        }

        const result = await trx
          .update(facilities)
          .set({
            capacity: newCapacity,
            updatedAt: new Date(),
          })
          .where(and(eq(facilities.id, facilityId), isNull(facilities.deletedAt)));

        if (result.rowsAffected === 0) {
          throw new NotFoundException('Facility not found');
        }
      });
    } catch (error) {
      this.#logger.error('Failed to update facility capacity', {
        facilityId,
        newCapacity,
        error: error.message,
      });

      // Re-throw NestJS exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Wrap other errors
      throw new InternalServerErrorException('Failed to update facility capacity');
    }
  }
}
```

## Module Organization

### Feature Module Structure

```typescript
@Module({
  imports: [
    DbModule.forFeature({
      drizzle: { schemas },
    }),
    NotificationModule,
  ],
  providers: [FacilityService, BuildingService, FacilityResolver],
  exports: [
    FacilityService, // Export if needed by other modules
  ],
})
export class FacilityModule {}
```

### Shared Module Pattern

```typescript
// shared.module.ts
@Global()
@Module({
  imports: [ConfigModule.forRoot(), LoggerModule],
  providers: [
    {
      provide: LOGGER_TOKEN,
      useFactory: (configService: ConfigService) => {
        return new Logger(configService.get('LOG_LEVEL'));
      },
      inject: [ConfigService],
    },
  ],
  exports: [LOGGER_TOKEN],
})
export class SharedModule {}
```

## Common Patterns

### Entity Existence Check

```typescript
async ensureFacilityExists(facilityId: string): Promise<void> {
  const { db } = await this.#drizzle.getScopedDb();

  const facility = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(
      and(
        eq(facilities.id, facilityId),
        isNull(facilities.deletedAt),
      ),
    )
    .limit(1);

  invariant(facility.length > 0, 'Facility not found');
}
```

### Unique Constraint Handling

```typescript
async createFacilityWithUniqueCheck(input: CreateFacilityInput): Promise<string> {
  const { runWithContext } = await this.#drizzle.getScopedDb();

  return await runWithContext(async (trx) => {
    // Check for existing facility with same name
    const existing = await trx
      .select({ id: facilities.id })
      .from(facilities)
      .where(
        and(
          eq(facilities.name, input.name),
          isNull(facilities.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        `Facility with name "${input.name}" already exists`,
      );
    }

    // Create the facility
    const facilityId = v4();
    await trx.insert(facilities).values({
      id: facilityId,
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return facilityId;
  });
}
```

## GraphQL Resolver Patterns

### CRUD vs Domain Graph

**Critical**: Understand which graph you're implementing for:

```typescript
// ❌ Wrong - Don't create resolvers for what PostGraphile can handle
@Resolver()
export class TenantResolver {
  @Query(() => [Tenant], { name: 'userTenants' })
  async getUserTenants(@CurrentUser() userId: string): Promise<Tenant[]> {
    // This is unnecessary! Use CRUD: tenants(filter: { ownerId: { equalTo: $userId } })
    return await this.#service.listTenantsByUser(userId);
  }
}

// ✅ Correct - Only create domain resolvers when CRUD truly can't handle it
@Resolver()
export class ComplexBusinessResolver {
  @Query(() => [ComputedResult], { name: 'complexBusinessLogic' })
  async getComplexData(@CurrentUser() userId: string): Promise<ComputedResult[]> {
    // Multiple external API calls, complex calculations, etc.
    // Document WHY PostGraphile couldn't handle this
    return await this.#service.performComplexBusinessLogic(userId);
  }
}
```

### PostGraphile CRUD Graph Capabilities

PostGraphile is more powerful than you think! It automatically provides:

1. **Filtering on any column** - `filter: { status: { equalTo: "active" }, ownerId: { equalTo: $userId } }`
2. **Complex filters** - `filter: { or: [{ status: { equalTo: "active" } }, { priority: { greaterThan: 5 } }] }`
3. **Relationship traversal** - `facility { buildings { nodes { rooms { nodes { ... } } } } }`
4. **Ordering** - `orderBy: [CREATED_AT_DESC, NAME_ASC]`
5. **Pagination** - `first: 20, after: $cursor`
6. **Aggregations** - PostGraphile plugins can add count, sum, avg, etc.

**Try these before creating custom resolvers!** 7. **Relationships** - Automatically handles joins and nested queries

**Example of what PostGraphile can handle automatically:**

```graphql
# No custom resolver needed for any of this!
query ComplexQuery($userId: UUID!) {
  facilities(filter: { ownerId: { equalTo: $userId }, isActive: { equalTo: true }, buildings: { some: { rooms: { some: { capacity: { greaterThan: 10 } } } } } }, orderBy: [CREATED_AT_DESC, NAME_ASC], first: 20) {
    nodes {
      id
      name
      buildings {
        nodes {
          id
          rooms(filter: { isAvailable: { equalTo: true } }) {
            nodes {
              id
              capacity
            }
          }
        }
      }
    }
  }
}
```

### Domain Graph Patterns

**Only create domain resolvers when PostGraphile CANNOT handle your use case!**

```typescript
// ✅ Good reasons for domain resolvers:
@Resolver()
export class BusinessLogicResolver {
  readonly #entityService: EntityService;
  readonly #externalApi: ExternalApiService;

  constructor(entityService: EntityService, externalApi: ExternalApiService) {
    this.#entityService = entityService;
    this.#externalApi = externalApi;
  }

  // Complex multi-entity workflow
  @Mutation(() => String, { name: 'processOrder' })
  async processOrder(@CurrentUser() userId: string, @Args('input') input: ProcessOrderInput): Promise<string> {
    // This involves: inventory check, payment processing,
    // notification dispatch, external API calls
    // PostGraphile can't orchestrate this workflow
    return await this.#entityService.processComplexOrder(input, userId);
  }

  // External API integration
  @Query(() => [EnrichedData], { name: 'enrichedUserData' })
  async getEnrichedData(@CurrentUser() userId: string): Promise<EnrichedData[]> {
    // Combines database data with external API data
    // PostGraphile can't call external services
    const dbData = await this.#entityService.getUserData(userId);
    const apiData = await this.#externalApi.getEnrichment(dbData);
    return this.#entityService.mergeData(dbData, apiData);
  }
}
```

### Type Mapping for GraphQL

When returning database entities through GraphQL, map column names:

```typescript
// Database has snake_case, GraphQL uses camelCase
@Resolver(() => Tenant)
export class TenantResolver {
  @Query(() => [Tenant], { name: 'tenants' })
  async getTenants(): Promise<Tenant[]> {
    const dbTenants = await this.#service.listTenants();

    // Map database columns to GraphQL fields
    return dbTenants.map((t) => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at, // created_at → createdAt
      updatedAt: t.updatedAt ?? t.created_at, // handle nulls
      isActive: t.isActive ?? false, // handle nullable booleans
      settings: t.settings ?? {}, // handle nullable JSON
    }));
  }
}
```

## Best Practices Summary

1. **Use hard-private fields** - Always use `readonly #field` pattern
2. **Separate DTOs from GraphQL types** - Keep internal types separate
3. **Use runWithContext for mutations** - All insert/update/delete operations
4. **Implement soft deletes** - Use deletedAt timestamps
5. **Validate with invariant** - Clear error messages for business rules
6. **Avoid N+1 queries** - Use batch operations and joins
7. **Handle errors properly** - Re-throw NestJS exceptions, wrap others
8. **Check entity existence** - Before performing operations
9. **Return entity IDs from mutations** - Let frontend refetch data
10. **Keep services focused** - Single responsibility principle
11. **Use CRUD first** - PostGraphile handles 90% of queries automatically
12. **Avoid custom resolvers** - Only create when CRUD truly can't handle it
13. **Document why** - If you create a domain resolver, comment why CRUD wasn't sufficient
14. **Map database to GraphQL** - Handle snake_case to camelCase conversion
