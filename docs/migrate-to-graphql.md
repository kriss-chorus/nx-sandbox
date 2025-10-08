# GitHub Dashboard API: REST to GraphQL Migration Guide

## Overview

This document tracks the migration of the github-dashboard API from a hybrid REST/PostGraphile setup to a pure NestJS GraphQL implementation. The goal is to consolidate all API operations under a single GraphQL endpoint while maintaining the existing functionality.

## Current State Analysis

### What We Have Now
- **PostGraphile**: Auto-generates CRUD GraphQL from database schema
- **REST Controllers**: Custom business logic for dashboards, users, repositories
- **Hybrid Approach**: Two different API patterns in one application

### What We Want
- **Single GraphQL Endpoint**: All operations through Apollo Server
- **NestJS GraphQL**: Code-first approach with TypeScript decorators
- **Consistent Patterns**: Following established GraphQL architecture patterns

## Migration Steps

### Step 1: Install Dependencies ✅
```bash
# In Nx monorepo, install dependencies at root level
pnpm add -w @nestjs/graphql @nestjs/apollo @apollo/server @apollo/gateway @apollo/subgraph @as-integrations/express5 @as-integrations/fastify ts-morph graphql
```

**Key Dependencies:**
- `@nestjs/graphql`: NestJS GraphQL integration
- `@nestjs/apollo`: Apollo Server integration for NestJS
- `@apollo/server`: Apollo Server v5 (latest)
- `@as-integrations/express5`: Express integration for Apollo Server
- `@as-integrations/fastify`: Fastify integration for Apollo Server
- `@apollo/gateway`: Apollo Gateway for federation
- `@apollo/subgraph`: Apollo Subgraph for federation
- `ts-morph`: TypeScript AST manipulation (required by NestJS GraphQL)
- `graphql`: Core GraphQL library

**Important Nx Monorepo Notes:**
- Always install dependencies at the root level using `pnpm add -w`
- Individual packages should not have their own dependencies
- This ensures consistent versions across the monorepo
- Fix tsconfig.json paths: packages should extend `../../../tsconfig.base.json` (not `../../tsconfig.base.json`)
- Nx monorepo structure: `packages/package-name/` requires 3 levels up to reach root

### Step 2: Create GraphQL Types

#### Object Types (Entities)
```typescript
// src/graphql/types/dashboard.type.ts
@ObjectType()
export class Dashboard {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isPublic: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [GitHubUser], { nullable: true })
  users?: GitHubUser[];

  @Field(() => [String], { nullable: true })
  repositories?: string[];

  @Field(() => ActivityConfig, { nullable: true })
  activityConfig?: ActivityConfig;
}
```

#### Input Types (DTOs)
```typescript
// src/graphql/inputs/dashboard.input.ts
@InputType()
export class CreateDashboardInput {
  @Field()
  @IsString()
  @MaxLength(255)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
```

**Key Learning Points:**
- Use `@ObjectType()` for return types
- Use `@InputType()` for mutation inputs
- Always include validation decorators from `class-validator`
- Use `@Field(() => Type)` for complex types and arrays
- Use `@Field({ nullable: true })` for optional fields

### Step 3: Convert Controllers to Resolvers

#### Query Resolvers
```typescript
// src/graphql/resolvers/dashboard.resolver.ts
@Resolver(() => Dashboard)
export class DashboardResolver {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Query(() => [Dashboard], { name: 'dashboards' })
  async getDashboards(): Promise<Dashboard[]> {
    return this.dashboardsService.findAllPublic();
  }

  @Query(() => Dashboard, { name: 'dashboard', nullable: true })
  async getDashboard(@Args('slug') slug: string): Promise<Dashboard | null> {
    return this.dashboardsService.findBySlug(slug);
  }
}
```

#### Mutation Resolvers
```typescript
@Mutation(() => String, { name: 'createDashboard' })
async createDashboard(
  @Args('input') input: CreateDashboardInput
): Promise<string> {
  const dashboard = await this.dashboardsService.create(input);
  return dashboard.id;
}

@Mutation(() => Boolean, { name: 'deleteDashboard' })
async deleteDashboard(@Args('id') id: string): Promise<boolean> {
  await this.dashboardsService.remove(id);
  return true;
}
```

**Key Learning Points:**
- Use `@Query()` for read operations
- Use `@Mutation()` for write operations
- Return IDs from mutations, not full objects
- Use `@Args()` to define input parameters
- Keep resolvers thin - delegate to services

### Step 4: Update App Module

```typescript
// src/app/app.module.ts
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    // ... existing imports
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true, // Generates schema automatically
      playground: true, // Enable GraphQL playground
      introspection: true, // Allow introspection queries
      context: ({ req }) => ({ req }), // Pass request context
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

**Key Learning Points:**
- `autoSchemaFile: true` generates schema from decorators
- `playground: true` enables GraphQL playground for testing
- `context` function provides request context to resolvers
- Apollo Driver is the recommended driver for NestJS

### Step 5: Update Main.ts

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend access
  app.enableCors({
    origin: ['http://localhost:4202', 'http://localhost:4201'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);

  Logger.log(`🚀 GitHub Dashboard GraphQL API is running on: http://localhost:${port}/graphql`);
  Logger.log(`🚀 GraphQL Playground is available at: http://localhost:${port}/graphql`);
}
```

**Key Learning Points:**
- Remove PostGraphile middleware
- GraphQL endpoint is automatically available at `/graphql`
- Playground is available at the same endpoint

## Challenges and Solutions

### Challenge 1: Complex Nested Queries
**Problem**: Dashboard with users and repositories requires multiple database calls
**Solution**: Use field resolvers to handle nested data loading

```typescript
@ResolveField(() => [GitHubUser], { name: 'users' })
async getUsers(@Parent() dashboard: Dashboard): Promise<GitHubUser[]> {
  return this.dashboardsService.getDashboardUsers(dashboard.id);
}
```

### Challenge 2: Input Validation
**Problem**: GraphQL inputs need validation like REST DTOs
**Solution**: Use `class-validator` decorators on input types

```typescript
@InputType()
export class CreateDashboardInput {
  @Field()
  @IsString()
  @MaxLength(255)
  name: string;
}
```

### Challenge 3: Module Naming Conflicts
**Problem**: Naming custom module `GraphQLModule` conflicts with NestJS `GraphQLModule`
**Solution**: Use descriptive, unique module names

```typescript
// ❌ Wrong - conflicts with NestJS GraphQLModule
export class GraphQLModule {}

// ✅ Correct - unique, descriptive name
export class GitHubDashboardGraphQLModule {}
```

### Challenge 4: Error Handling
**Problem**: REST exceptions need to be converted to GraphQL errors
**Solution**: Use GraphQL error formatting

```typescript
@Mutation(() => String)
async createDashboard(@Args('input') input: CreateDashboardInput): Promise<string> {
  try {
    return await this.dashboardsService.create(input);
  } catch (error) {
    if (error instanceof ConflictException) {
      throw new GraphQLError(error.message, {
        extensions: { code: 'CONFLICT' }
      });
    }
    throw error;
  }
}
```

## Key Learning Points

### 1. GraphQL vs REST Mental Model
- **REST**: Multiple endpoints, each with specific purpose
- **GraphQL**: Single endpoint, flexible query structure
- **Queries**: Read operations (like GET)
- **Mutations**: Write operations (like POST/PUT/DELETE)

### 2. Type Safety
- GraphQL schema is strongly typed
- TypeScript decorators generate schema automatically
- Input validation happens at GraphQL layer
- Return types must match schema exactly

### 3. N+1 Query Problem
- Field resolvers can cause N+1 queries
- Use DataLoader pattern for batching
- Consider eager loading for simple relationships

### 4. Schema Design
- Design schema based on client needs
- Use connections for pagination
- Keep mutations focused and atomic
- Use enums for fixed value sets

### 5. Testing Strategy
- Test resolvers with GraphQL test utilities
- Mock services, not database
- Test error scenarios
- Use GraphQL playground for manual testing

## Migration Progress

### ✅ COMPLETED: Dashboard Module Migration
- [x] Install GraphQL dependencies
- [x] Create object types for all entities
- [x] Create input types for all DTOs
- [x] Convert controllers to resolvers
- [x] Update app module configuration
- [x] Update main.ts
- [x] Fix TypeScript configuration paths
- [x] Fix module naming conflicts
- [x] Test all GraphQL operations
- [x] Remove old REST endpoints (Dashboard controller removed)
- [x] Create comprehensive migration documentation

### 🔄 REMAINING TASKS
- [ ] Convert GitHub REST endpoints to GraphQL
- [ ] Update frontend to use GraphQL

## Migration Status: ✅ POSTGRAPHILE CRUD COMPLETE

### What We Accomplished
Successfully converted from REST API to PostGraphile CRUD operations while keeping the PostGraphile auto-generated GraphQL approach.

### Current State: PostGraphile CRUD
- **PostGraphile GraphQL** at `/graphql` - Auto-generated CRUD operations from database schema
- **No REST endpoints** - All CRUD operations now use PostGraphile GraphQL
- **PostGraphile UI** at `/graphiql` - For testing and exploration
- **Frontend** uses PostGraphile GraphQL client for all operations

### What Was Implemented
- ✅ Removed REST dashboard controller
- ✅ Created PostGraphile GraphQL client for frontend
- ✅ Created React hooks for PostGraphile CRUD operations
- ✅ Built new PostGraphileDashboard component
- ✅ Updated routing to use PostGraphile component
- ✅ Tested CRUD operations (Create, Read, Update, Delete)
- ✅ Fixed missing data issue on home page (added dashboard list fetching)

### Current Setup
The API now uses pure PostGraphile CRUD:
- **PostGraphile** provides all CRUD operations automatically
- **Frontend** uses GraphQL queries and mutations
- **No custom REST controllers** needed for basic CRUD
- **Type-safe** operations with auto-generated schema

## Issues Encountered and Solutions

### Issue 1: TypeScript Configuration Paths
**Problem**: `Cannot find base config file "../../tsconfig.base.json"`
**Root Cause**: Incorrect relative paths in tsconfig.json files
**Solution**: Update all tsconfig.json files to use correct relative paths
```bash
# Fixed paths in all packages
"extends": "../../../tsconfig.base.json"  # Instead of "../../tsconfig.base.json"
```

### Issue 2: Module Naming Conflicts
**Problem**: `TypeError: Cannot set property GraphQLModule of #<Object> which has only a getter`
**Root Cause**: Custom module named `GraphQLModule` conflicts with NestJS `GraphQLModule`
**Solution**: Rename custom module to avoid conflicts
```typescript
// Before (conflicting)
export class GraphQLModule {}

// After (unique)
export class GitHubDashboardGraphQLModule {}
```

### Issue 3: Nx Monorepo Dependency Management
**Problem**: Dependencies installed in individual packages instead of root
**Root Cause**: Not following Nx monorepo best practices
**Solution**: Move all dependencies to root level
```bash
# Remove from package
pnpm remove @nestjs/graphql @nestjs/apollo ...

# Add to root
pnpm add -w @nestjs/graphql @nestjs/apollo ...
```

### Issue 4: Missing Data on Home Page
**Problem**: Frontend showed no data on home page (`/`) because hook only fetched data when `slug` was provided
**Solution**: Updated `useDashboardDataPostGraphile` hook to fetch all dashboards when no slug is provided
**Implementation**:
- Added `dashboards: Dashboard[]` to the `DashboardData` interface
- Modified `useEffect` to call `DASHBOARD_QUERIES.getAll` when `slug` is undefined
- Updated `PostGraphileDashboard` component to display dashboard list on home page
**Learning**: Always consider both list and detail views when designing data fetching hooks

### Issue 5: Partial Migration Scope
**Problem**: GitHub controller still uses REST endpoints
**Root Cause**: GitHub API integration is complex and used by frontend
**Solution**: Keep GitHub REST endpoints for now, convert to GraphQL in future iteration
**Note**: Dashboard functionality is fully migrated to GraphQL

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
Each file has a single, well-defined responsibility:

- **Types**: Each type file defines one entity structure
- **Inputs**: Each input file handles one type of input validation
- **Resolvers**: Each resolver handles one domain (Dashboard, ActivityType)
- **Modules**: Each module has one configuration responsibility

### Open/Closed Principle (OCP)
- GraphQL types are open for extension (new fields) but closed for modification
- Resolvers can be extended with new queries/mutations without changing existing code

### Liskov Substitution Principle (LSP)
- All GraphQL types properly implement their interfaces
- Input types can be substituted for their base types

### Interface Segregation Principle (ISP)
- Each resolver only depends on the services it actually needs
- Input types are focused and don't include unnecessary fields

### Dependency Inversion Principle (DIP)
- Resolvers depend on abstractions (services) not concrete implementations
- Services are injected through constructor injection

## Testing the Migration

### GraphQL Playground
1. Start the API: `pnpm nx serve api`
2. Open: `http://localhost:3001/graphql`
3. Test queries and mutations

### Troubleshooting

#### "Fetching failed not found" Error
**Problem**: Frontend still calling old REST endpoints
**Solution**: Update frontend to use GraphQL or temporarily restore REST endpoints

**Quick Fix**: Test GraphQL directly at `http://localhost:3001/graphql`

**Frontend Update Needed**: Change API calls from:
```typescript
// Old REST calls
fetch('/api/dashboards')
fetch('/api/dashboards/123/users')
```

To GraphQL:
```typescript
// New GraphQL calls
const { data } = useQuery(GET_DASHBOARDS);
const [addUser] = useMutation(ADD_USER_TO_DASHBOARD);
```

### Example Queries
```graphql
# Get all dashboards
query GetDashboards {
  dashboards {
    id
    name
    slug
    description
    isPublic
    userCount
  }
}

# Get specific dashboard
query GetDashboard($slug: String!) {
  dashboard(slug: $slug) {
    id
    name
    slug
    description
    users {
      githubUsername
      displayName
    }
    repositories
  }
}
```

### Example Mutations
```graphql
# Create dashboard
mutation CreateDashboard($input: CreateDashboardInput!) {
  createDashboard(input: $input)
}

# Add user to dashboard
mutation AddUserToDashboard($dashboardId: String!, $input: AddUserToDashboardInput!) {
  addUserToDashboard(dashboardId: $dashboardId, input: $input)
}
```

## Next Steps

1. **Frontend Integration**: Update React app to use Apollo Client
2. **Authentication**: Add GraphQL authentication guards
3. **Subscriptions**: Add real-time updates for dashboard changes
4. **Performance**: Implement DataLoader for N+1 query optimization
5. **Documentation**: Generate GraphQL schema documentation

## Resources

- [NestJS GraphQL Documentation](https://docs.nestjs.com/graphql/quick-start)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Agent Context GraphQL Patterns](../agent_context/graphql-architecture.md)
