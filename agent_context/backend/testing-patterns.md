# Testing Patterns

## Overview

This guide covers testing patterns for backend services, focusing on integration tests with proper database transaction management and cleanup strategies.

## Test Module Setup

### Basic Test Configuration

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { DbModule, SCOPED_DB_SERVICE_TOKEN, TestDrizzleService } from '@platform/nestjs-db';
import { v4 as uuidv4 } from 'uuid';

describe('FacilityService', () => {
  let module: TestingModule;
  let facilityService: FacilityService;
  let dbFactory: TestDrizzleService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        DbModule.forRoot({
          drizzle: { schemas },
        }),
      ],
      providers: [FacilityService],
    }).compile();

    module.enableShutdownHooks();
    await module.init();

    facilityService = await module.resolve<FacilityService>(FacilityService);
    dbFactory = await module.resolve<TestDrizzleService>(SCOPED_DB_SERVICE_TOKEN);

    // Start transaction for test isolation
    await dbFactory.beginTransaction();
  });

  afterEach(async () => {
    // Rollback all changes made during the test
    await dbFactory.rollbackTransaction();
    await module.close();
  });
});
```

## Transaction Management in Tests

### ⚠️ IMPORTANT: Always Use runWithContext

Even in test code, you MUST use `runWithContext` when accessing the database for mutations:

```typescript
// ❌ WRONG - Don't do this in tests
it('should create facility', async () => {
  const { db } = await dbFactory.getScopedDb();
  await db.insert(facilities).values({ ... }); // Don't use db directly!
});

// ✅ CORRECT - Always use runWithContext
it('should create facility', async () => {
  const { runWithContext } = await dbFactory.getScopedDb();

  await runWithContext(async (trx) => {
    await trx.insert(facilities).values({
      id: uuidv4(),
      name: `Test Facility ${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
});
```

### Test Data Setup

```typescript
describe('BuildingService', () => {
  let buildingService: BuildingService;
  let testFacilityId: string;

  beforeEach(async () => {
    // ... module setup ...

    // Create test data within transaction
    const { runWithContext } = await dbFactory.getScopedDb();

    testFacilityId = uuidv4();

    await runWithContext(async (trx) => {
      // Create test facility
      await trx.insert(facilities).values({
        id: testFacilityId,
        name: `Test Facility ${uuidv4()}`,
        capacity: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create test buildings
      const buildingIds = [uuidv4(), uuidv4()];
      await trx.insert(buildings).values(
        buildingIds.map((id, index) => ({
          id,
          facilityId: testFacilityId,
          name: `Building ${index + 1}`,
          floors: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    });
  });
});
```

## Testing Service Methods

### Testing Create Operations

```typescript
describe('createFacility', () => {
  it('should create a new facility', async () => {
    // Arrange
    const facilityName = `Test Facility ${uuidv4()}`;
    const input: CreateFacilityInput = {
      name: facilityName,
      description: 'Test description',
      capacity: 50,
    };

    // Act
    const facilityId = await facilityService.createFacility(input);

    // Assert
    expect(facilityId).toBeDefined();
    expect(typeof facilityId).toBe('string');

    // Verify in database
    const { db } = await dbFactory.getScopedDb();
    const created = await db.select().from(facilities).where(eq(facilities.id, facilityId)).limit(1);

    expect(created).toHaveLength(1);
    expect(created[0].name).toBe(facilityName);
    expect(created[0].description).toBe(input.description);
    expect(created[0].capacity).toBe(50);
  });

  it('should throw error for duplicate name', async () => {
    // Arrange - Create first facility
    const facilityName = `Test Facility ${uuidv4()}`;
    await facilityService.createFacility({ name: facilityName });

    // Act & Assert
    await expect(facilityService.createFacility({ name: facilityName })).rejects.toThrow('Facility with name');
  });
});
```

### Testing Update Operations

```typescript
describe('updateFacility', () => {
  let existingFacilityId: string;

  beforeEach(async () => {
    // Create facility to update
    const { runWithContext } = await dbFactory.getScopedDb();
    existingFacilityId = uuidv4();

    await runWithContext(async (trx) => {
      await trx.insert(facilities).values({
        id: existingFacilityId,
        name: `Original Facility ${uuidv4()}`,
        capacity: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });

  it('should update facility details', async () => {
    // Arrange
    const newName = `Updated Facility ${uuidv4()}`;
    const updateInput: UpdateFacilityInput = {
      name: newName,
      capacity: 75,
    };

    // Act
    await facilityService.updateFacility(existingFacilityId, updateInput);

    // Assert
    const { db } = await dbFactory.getScopedDb();
    const updated = await db.select().from(facilities).where(eq(facilities.id, existingFacilityId)).limit(1);

    expect(updated[0].name).toBe(newName);
    expect(updated[0].capacity).toBe(75);
    expect(updated[0].updatedAt.getTime()).toBeGreaterThan(updated[0].createdAt.getTime());
  });

  it('should throw error when facility not found', async () => {
    // Arrange
    const nonExistentId = uuidv4();

    // Act & Assert
    await expect(facilityService.updateFacility(nonExistentId, { name: 'New Name' })).rejects.toThrow('Facility not found');
  });
});
```

### Testing Complex Business Logic

```typescript
describe('assignItemToLocation', () => {
  let locationId: string;
  let itemId: string;

  beforeEach(async () => {
    const { runWithContext } = await dbFactory.getScopedDb();

    // Create test location with capacity
    locationId = uuidv4();
    itemId = uuidv4();

    await runWithContext(async (trx) => {
      await trx.insert(locations).values({
        id: locationId,
        name: `Test Location ${uuidv4()}`,
        capacity: 2, // Small capacity for testing
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await trx.insert(items).values({
        id: itemId,
        name: `Test Item ${uuidv4()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });

  it('should assign item to location', async () => {
    // Act
    await itemService.assignItemToLocation(itemId, locationId);

    // Assert
    const { db } = await dbFactory.getScopedDb();
    const item = await db.select().from(items).where(eq(items.id, itemId)).limit(1);

    expect(item[0].locationId).toBe(locationId);
    expect(item[0].assignedAt).toBeDefined();
  });

  it('should prevent assignment when location is full', async () => {
    // Arrange - Fill the location
    const { runWithContext } = await dbFactory.getScopedDb();

    await runWithContext(async (trx) => {
      // Create items to fill capacity
      const itemIds = [uuidv4(), uuidv4()];
      await trx.insert(items).values(
        itemIds.map((id) => ({
          id,
          name: `Item ${id}`,
          locationId,
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    });

    // Act & Assert
    await expect(itemService.assignItemToLocation(itemId, locationId)).rejects.toThrow('Location is at full capacity');
  });
});
```

## Testing with Unique Constraints

### Handling Global Unique Constraints

For entities with globally unique constraints (like facility names), always append a UUID to test data names:

```typescript
describe('FacilityService with unique constraints', () => {
  it('should handle unique name validation', async () => {
    // Always use UUID to prevent test collisions
    const facilityName = `Test Facility ${uuidv4()}`;

    // Create first facility
    await facilityService.createFacility({ name: facilityName });

    // Attempt to create duplicate
    await expect(facilityService.createFacility({ name: facilityName })).rejects.toThrow(/already exists/);
  });

  it('should allow same name after soft delete', async () => {
    // Arrange
    const facilityName = `Test Facility ${uuidv4()}`;
    const firstId = await facilityService.createFacility({ name: facilityName });

    // Soft delete the first facility
    await facilityService.deleteFacility(firstId);

    // Act - Should allow creating with same name
    const secondId = await facilityService.createFacility({ name: facilityName });

    // Assert
    expect(secondId).toBeDefined();
    expect(secondId).not.toBe(firstId);
  });
});
```

## Testing Batch Operations

### Avoiding N+1 in Tests

```typescript
describe('Batch operations', () => {
  it('should update multiple records efficiently', async () => {
    // Arrange - Create test records
    const { runWithContext } = await dbFactory.getScopedDb();
    const recordIds: string[] = [];

    await runWithContext(async (trx) => {
      const records = Array.from({ length: 5 }, (_, i) => ({
        id: uuidv4(),
        name: `Record ${i} ${uuidv4()}`,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      recordIds.push(...records.map((r) => r.id));
      await trx.insert(testRecords).values(records);
    });

    // Act
    await recordService.updateBatchStatus(recordIds, 'active');

    // Assert - Verify all updated in single query
    const { db } = await dbFactory.getScopedDb();
    const updated = await db.select().from(testRecords).where(inArray(testRecords.id, recordIds));

    expect(updated).toHaveLength(5);
    expect(updated.every((r) => r.status === 'active')).toBe(true);
  });
});
```

## Testing Error Scenarios

### Database Error Handling

```typescript
describe('Error handling', () => {
  it('should handle concurrent updates gracefully', async () => {
    // Arrange
    const facilityId = uuidv4();
    const { runWithContext } = await dbFactory.getScopedDb();

    await runWithContext(async (trx) => {
      await trx.insert(facilities).values({
        id: facilityId,
        name: `Test Facility ${uuidv4()}`,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Simulate concurrent update
    const { db } = await dbFactory.getScopedDb();
    await db.update(facilities).set({ version: 2 }).where(eq(facilities.id, facilityId));

    // Act & Assert
    await expect(
      facilityService.updateWithOptimisticLock(
        facilityId,
        { name: 'New Name' },
        1, // Old version
      ),
    ).rejects.toThrow(/modified by another user/);
  });
});
```

## Mocking External Dependencies

```typescript
describe('NotificationService integration', () => {
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    notificationService = {
      sendEmail: jest.fn(),
      sendSMS: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      imports: [DbModule.forRoot({ drizzle: { schemas } })],
      providers: [
        FacilityService,
        {
          provide: NotificationService,
          useValue: notificationService,
        },
      ],
    }).compile();

    facilityService = module.get<FacilityService>(FacilityService);
  });

  it('should send notification on facility creation', async () => {
    // Arrange
    const facilityName = `Test Facility ${uuidv4()}`;
    notificationService.sendEmail.mockResolvedValue(true);

    // Act
    await facilityService.createFacility({ name: facilityName });

    // Assert
    expect(notificationService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'New Facility Created',
        body: expect.stringContaining(facilityName),
      }),
    );
  });
});
```

## Performance Testing

```typescript
describe('Performance tests', () => {
  it('should handle large datasets efficiently', async () => {
    // Arrange - Create many records
    const { runWithContext } = await dbFactory.getScopedDb();
    const facilityId = uuidv4();

    await runWithContext(async (trx) => {
      // Create facility
      await trx.insert(facilities).values({
        id: facilityId,
        name: `Test Facility ${uuidv4()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create 1000 buildings
      const buildings = Array.from({ length: 1000 }, (_, i) => ({
        id: uuidv4(),
        facilityId,
        name: `Building ${i}`,
        floors: Math.floor(Math.random() * 10) + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Insert in batches
      for (let i = 0; i < buildings.length; i += 100) {
        await trx.insert(buildingsTable).values(buildings.slice(i, i + 100));
      }
    });

    // Act
    const start = Date.now();
    const stats = await facilityService.calculateStatistics(facilityId);
    const duration = Date.now() - start;

    // Assert
    expect(stats.totalBuildings).toBe(1000);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});
```

## Best Practices Summary

1. **Always use runWithContext in tests** - Even for test data setup
2. **Use UUID suffixes** - Prevent collisions in parallel tests
3. **Clean up with transactions** - Rollback after each test
4. **Test both success and error paths** - Include edge cases
5. **Mock external dependencies** - Isolate what you're testing
6. **Use realistic test data** - But with unique identifiers
7. **Verify database state** - Don't just check return values
8. **Test batch operations** - Ensure N+1 queries are avoided
9. **Handle concurrent scenarios** - Test optimistic locking
10. **Keep tests independent** - Each test should be self-contained
