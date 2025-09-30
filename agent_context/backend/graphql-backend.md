# GraphQL Backend Patterns

## Overview

This guide covers GraphQL backend patterns using NestJS with a code-first approach. We automatically generate the GraphQL schema from TypeScript decorators, ensuring type safety and consistency.

## Code-First Architecture

### Basic Resolver Structure

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';

@Resolver('Facility')
@GqlAuthentication()
export class FacilityResolver {
  readonly #facilityService: FacilityService;

  constructor(facilityService: FacilityService) {
    this.#facilityService = facilityService;
  }

  @Query(() => [Facility], { name: 'facilities' })
  async getFacilities(): Promise<Facility[]> {
    return await this.#facilityService.getFacilities();
  }

  @Query(() => Facility, { name: 'facility', nullable: true })
  async getFacility(@Args('id') id: string): Promise<Facility | null> {
    return await this.#facilityService.getFacilityById(id);
  }

  @Mutation(() => String, { name: 'createFacility' })
  async createFacility(@Args('input') input: CreateFacilityInput): Promise<string> {
    return await this.#facilityService.createFacility(input);
  }
}
```

## Input Types

### Defining Input Types

All GraphQL input types are defined as TypeScript classes with `@InputType()` decorator:

```typescript
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsOptional, Min, Max, IsUUID } from 'class-validator';

@InputType()
export class CreateFacilityInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(10000)
  capacity?: number;
}

@InputType()
export class UpdateFacilityInput {
  @Field()
  @IsUUID()
  facilityId: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(10000)
  capacity?: number;
}
```

### Complex Input Types

```typescript
@InputType()
export class CreateBuildingInput {
  @Field()
  @IsUUID()
  facilityId: string;

  @Field()
  @IsString()
  name: string;

  @Field(() => Int)
  @Min(1)
  @Max(100)
  floors: number;

  @Field(() => [CreateRoomInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomInput)
  rooms?: CreateRoomInput[];
}

@InputType()
export class CreateRoomInput {
  @Field()
  @IsString()
  name: string;

  @Field(() => Int)
  @Min(1)
  floor: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  capacity?: number;
}
```

## Object Types

### Entity Object Types

```typescript
import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class Facility {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  capacity?: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [Building], { nullable: true })
  buildings?: Building[];
}

@ObjectType()
export class Building {
  @Field(() => ID)
  id: string;

  @Field()
  facilityId: string;

  @Field()
  name: string;

  @Field(() => Int)
  floors: number;

  @Field(() => Facility, { nullable: true })
  facility?: Facility;

  @Field(() => [Room], { nullable: true })
  rooms?: Room[];
}
```

## Resolver Patterns

### Query Resolvers

```typescript
@Resolver('Facility')
@GqlAuthentication()
export class FacilityResolver {
  @Query(() => FacilityConnection, { name: 'facilitiesConnection' })
  async getFacilitiesConnection(@Args('first', { type: () => Int, nullable: true }) first?: number, @Args('after', { nullable: true }) after?: string, @Args('filter', { nullable: true }) filter?: FacilityFilterInput): Promise<FacilityConnection> {
    return await this.#facilityService.getFacilitiesConnection({
      first: first || 20,
      after,
      filter,
    });
  }

  @Query(() => FacilityStats, { name: 'facilityStats' })
  async getFacilityStats(@Args('facilityId') facilityId: string): Promise<FacilityStats> {
    return await this.#facilityService.calculateStats(facilityId);
  }
}
```

### Mutation Resolvers

```typescript
@Resolver('Facility')
@GqlAuthentication()
export class FacilityResolver {
  @Mutation(() => String, {
    name: 'createFacility',
    description: 'Creates a new facility and returns its ID',
  })
  async createFacility(@Args('input') input: CreateFacilityInput): Promise<string> {
    // Validate business rules
    await this.#facilityService.validateUniqueName(input.name);

    // Create facility
    return await this.#facilityService.createFacility(input);
  }

  @Mutation(() => String, { name: 'updateFacility' })
  async updateFacility(@Args('input') input: UpdateFacilityInput): Promise<string> {
    // Check permissions
    await this.#authService.checkFacilityPermission(input.facilityId, 'update');

    // Update facility
    await this.#facilityService.updateFacility(input.facilityId, input);

    return input.facilityId;
  }

  @Mutation(() => Boolean, { name: 'deleteFacility' })
  async deleteFacility(@Args('id') id: string): Promise<boolean> {
    await this.#facilityService.deleteFacility(id);
    return true;
  }
}
```

### Field Resolvers

```typescript
@Resolver(() => Facility)
@GqlAuthentication()
export class FacilityFieldResolver {
  @ResolveField(() => [Building], { name: 'buildings' })
  async getBuildings(@Parent() facility: Facility): Promise<Building[]> {
    return await this.#buildingService.getBuildingsByFacilityId(facility.id);
  }

  @ResolveField(() => Int, { name: 'buildingCount' })
  async getBuildingCount(@Parent() facility: Facility): Promise<number> {
    return await this.#buildingService.countByFacilityId(facility.id);
  }

  @ResolveField(() => FacilityStats, { name: 'statistics' })
  async getStatistics(@Parent() facility: Facility): Promise<FacilityStats> {
    return await this.#statsService.calculateFacilityStats(facility.id);
  }
}
```

## Pagination Patterns

### Relay-Style Connections

```typescript
@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

@ObjectType()
export class FacilityEdge {
  @Field()
  cursor: string;

  @Field(() => Facility)
  node: Facility;
}

@ObjectType()
export class FacilityConnection {
  @Field(() => [FacilityEdge])
  edges: FacilityEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}

// Resolver implementation
@Query(() => FacilityConnection)
async facilities(
  @Args('first', { type: () => Int, nullable: true }) first?: number,
  @Args('after', { nullable: true }) after?: string,
  @Args('last', { type: () => Int, nullable: true }) last?: number,
  @Args('before', { nullable: true }) before?: string,
): Promise<FacilityConnection> {
  return await this.#facilityService.paginate({
    first,
    after,
    last,
    before,
  });
}
```

## Error Handling

### GraphQL Error Formatting

```typescript
import { GraphQLError } from 'graphql';

@Injectable()
export class GraphQLErrorFormatter {
  format(error: any): GraphQLError {
    // Business logic errors
    if (error instanceof BusinessLogicException) {
      return new GraphQLError(error.message, {
        extensions: {
          code: error.code,
          field: error.field,
        },
      });
    }

    // Validation errors
    if (error instanceof ValidationException) {
      return new GraphQLError('Validation failed', {
        extensions: {
          code: 'VALIDATION_ERROR',
          validationErrors: error.errors,
        },
      });
    }

    // Default error
    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_ERROR',
      },
    });
  }
}
```

### Custom Exceptions

```typescript
export class DuplicateNameException extends Error {
  constructor(entityType: string, name: string) {
    super(`${entityType} with name "${name}" already exists`);
    this.name = 'DuplicateNameException';
  }
}

export class CapacityExceededException extends Error {
  constructor(current: number, requested: number, max: number) {
    super(
      `Cannot add ${requested} items. Current: ${current}, Max: ${max}`,
    );
    this.name = 'CapacityExceededException';
  }
}

// Usage in resolver
@Mutation(() => String)
async createFacility(
  @Args('input') input: CreateFacilityInput,
): Promise<string> {
  const existing = await this.#facilityService.findByName(input.name);

  if (existing) {
    throw new DuplicateNameException('Facility', input.name);
  }

  return await this.#facilityService.createFacility(input);
}
```

## Context and Authorization

### Request Context

```typescript
export interface GraphQLContext {
  req: Request;
  user?: User;
  tenantId?: string;
}

@Resolver()
export class ProtectedResolver {
  @Query(() => [Facility])
  @UseGuards(GqlAuthGuard)
  async myFacilities(@Context() context: GraphQLContext): Promise<Facility[]> {
    return await this.#facilityService.getFacilitiesByUser(context.user.id);
  }
}
```

### Custom Decorators

```typescript
// Current user decorator
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().user;
  },
);

// Usage
@Mutation(() => String)
async createMyFacility(
  @CurrentUser() user: User,
  @Args('input') input: CreateFacilityInput,
): Promise<string> {
  return await this.#facilityService.createFacility({
    ...input,
    ownerId: user.id,
  });
}
```

## Subscription Patterns

```typescript
@Resolver()
@GqlAuthentication()
export class FacilitySubscriptionResolver {
  @Subscription(() => Facility, {
    name: 'facilityUpdated',
    filter: (payload, variables) => {
      return payload.facilityUpdated.id === variables.facilityId;
    },
  })
  facilityUpdated(
    @Args('facilityId') facilityId: string,
  ) {
    return this.#pubSub.asyncIterator('facilityUpdated');
  }

  @Subscription(() => Building, {
    name: 'buildingAdded',
  })
  buildingAdded(
    @Args('facilityId') facilityId: string,
  ) {
    return this.#pubSub.asyncIterator(`buildingAdded.${facilityId}`);
  }
}

// Publishing events
@Mutation(() => String)
async updateFacility(
  @Args('input') input: UpdateFacilityInput,
): Promise<string> {
  const facilityId = await this.#facilityService.updateFacility(input);

  // Publish update event
  const facility = await this.#facilityService.getFacilityById(facilityId);
  await this.#pubSub.publish('facilityUpdated', {
    facilityUpdated: facility,
  });

  return facilityId;
}
```

## Testing Resolvers

```typescript
describe('FacilityResolver', () => {
  let resolver: FacilityResolver;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DbModule.forRoot({ drizzle: { schemas } })],
      providers: [FacilityResolver, FacilityService],
    }).compile();

    resolver = module.get<FacilityResolver>(FacilityResolver);
  });

  describe('createFacility', () => {
    it('should create facility and return ID', async () => {
      const input: CreateFacilityInput = {
        name: `Test Facility ${v4()}`,
        description: 'Test description',
        capacity: 100,
      };

      const facilityId = await resolver.createFacility(input);

      expect(facilityId).toBeDefined();
      expect(typeof facilityId).toBe('string');

      // Verify facility was created
      const facility = await resolver.getFacility(facilityId);
      expect(facility?.name).toBe(input.name);
    });

    it('should throw error for duplicate name', async () => {
      const name = `Test Facility ${v4()}`;

      // Create first facility
      await resolver.createFacility({ name });

      // Attempt to create duplicate
      await expect(resolver.createFacility({ name })).rejects.toThrow(DuplicateNameException);
    });
  });
});
```

## Best Practices

1. **Use @InputType() for all inputs** - Never use plain objects
2. **Add validation decorators** - Validate at the GraphQL layer
3. **Return IDs from mutations** - Let frontend refetch data
4. **Use field resolvers for relations** - Avoid N+1 queries
5. **Implement proper error handling** - Return meaningful errors
6. **Add descriptions to schema** - Document your API
7. **Use custom scalars when needed** - For dates, JSON, etc.
8. **Separate concerns** - Keep resolvers thin, logic in services
9. **Type everything** - Leverage TypeScript's type safety
10. **Test your resolvers** - Include error cases
