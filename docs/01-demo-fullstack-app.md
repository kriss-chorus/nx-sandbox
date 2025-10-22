# Demo 1: Full Stack App - GitHub Dashboard

> **📖 See the [GitHub Dashboard README](../packages/github-dashboard/README.md) for current implementation status and features.**

---

## 📚 Table of Contents

### Part 1: Understanding the Stack

1. [Learning Objectives](#-learning-objectives)
2. [Project Overview](#-project-overview)
3. [Technology Stack Deep Dive](#-technology-stack-deep-dive)
4. [Architecture Overview](#️-architecture-overview)

### Part 2: Building the Application

5. [Phase 1: Project Setup](#phase-1-project-setup-)
6. [Phase 2: Database Design & Setup](#phase-2-database-design--setup)
7. [Phase 3: Development Environment](#phase-3-development-environment)
8. [Phase 4: Backend Development](#phase-4-backend-development)
9. [Phase 5: Frontend Development](#phase-5-frontend-development)

### Part 3: Running & Debugging

10. [Quick Start Guide](#-quick-start-guide)
11. [Development Commands](#-development-commands)
12. [Service Access Guide](#-service-access-guide)

### Part 4: Lessons Learned

13. [Building with LLM: What I Learned](#-building-with-llm-what-i-learned)
14. [Key Technical Learnings](#-key-technical-learnings)
15. [Resources for Learning](#-resources-for-learning)

---

## 📚 **Learning Objectives**

This project demonstrates building a modern full-stack application using:

- **Nx Monorepo** - Managing multiple projects in one repository
- **NestJS** - Enterprise-grade Node.js backend framework
- **React + Material-UI** - Modern frontend with component library
- **PostgreSQL + Drizzle ORM** - Type-safe database operations
- **Tilt** - Development environment orchestration
- **Docker** - Containerization for services

---

## 🎯 **Project Overview**

**GitHub Dashboard Builder** - A web application that allows users to create custom dashboards tracking GitHub activity for multiple developers and repositories.

### **Key Features:**

- 📊 **Dashboard Builder** - Create custom dashboards with widgets
- 👥 **Multi-User Tracking** - Track multiple GitHub users in one dashboard
- 📂 **Repository Management** - Add/remove repositories to track
- 📈 **Data Visualization** - Charts and graphs for GitHub statistics
- 🔗 **GitHub API Integration** - Real-time data from GitHub API
- 🎨 **Customizable UI** - Drag-and-drop widget arrangement

---

## 🔧 **Technology Stack Deep Dive**

### **Why These Technologies?**

| Technology      | Purpose                   | Why Chosen                                                | Key Learning Value                    |
| --------------- | ------------------------- | --------------------------------------------------------- | ------------------------------------- |
| **Nx**          | Monorepo management       | Build optimization, code sharing, consistent tooling      | Enterprise-scale project organization |
| **NestJS**      | Backend framework         | Enterprise patterns, TypeScript, dependency injection     | Scalable backend architecture         |
| **React**       | Frontend framework        | Component-based, rich ecosystem, industry standard        | Modern UI development                 |
| **Material-UI** | UI components             | Design system, accessibility, production-ready            | Professional UI/UX                    |
| **PostgreSQL**  | Database                  | ACID compliance, JSONB support, battle-tested             | Relational data modeling              |
| **Drizzle ORM** | Database ORM              | Type safety, performance, SQL-like syntax                 | Type-safe database operations         |
| **Tilt**        | Development orchestration | Service management, hot reload, multi-service development | DevOps fundamentals                   |
| **Docker**      | Containerization          | Consistent environments, deployment readiness             | Modern deployment practices           |

### **NestJS Architecture Patterns**

Understanding these concepts is crucial before diving into implementation:

#### **What is a Module?**

- The organizational unit in NestJS. A `Module` groups related providers (services, repositories), controllers, and imports.
- The `AppModule` is the root. Feature modules (e.g., `DashboardsModule`) encapsulate a vertical slice (routes + logic + data access).

#### **What is a Controller?**

- The HTTP boundary. A `Controller` maps routes to methods (e.g., `GET /dashboards/:slug`).
- It should remain thin: parse/validate input, call a service, shape the HTTP response.

#### **What is a Service?**

- The business logic layer. A `Service` implements use-cases (create dashboard, list public dashboards, etc.).
- It orchestrates repositories and other services. No HTTP details here.

#### **What is a Repository?**

- The data access layer. A `Repository` encapsulates queries against tables/entities (using Drizzle ORM here).
- Benefits: single responsibility, testability (easy to mock), and a clean separation from business logic.

#### **How They Fit Together (Request Flow)**

```
Client → Controller (HTTP) → Service (business logic) → Repository (data) → Database
```

#### **Example Structure for the Dashboards Feature**

```
src/
  app/
    app.module.ts                 # imports DashboardsModule, DatabaseModule
  dashboards/
    dashboards.module.ts          # wires controller + service + repos
    dashboards.controller.ts      # HTTP routes for dashboards
    dashboards.service.ts         # business logic for dashboards
    dto/
      create-dashboard.dto.ts     # request validation
      update-dashboard.dto.ts     # request validation
  database/
    entities/                     # drizzle table definitions
    repositories/
      dashboard.repository.ts     # data access for dashboards
    schema.ts                     # barrel re-export of entities
```

### **DTOs (Data Transfer Objects)**

#### **What is a DTO?**

A small TypeScript class that defines the shape of data crossing a boundary (typically HTTP). It is your explicit API contract.

#### **Why Use DTOs?**

- **Explicit contract**: Clients know what to send/expect
- **Validation**: With `class-validator` decorators you enforce required/optional, types, and lengths at the edge
- **Decoupling**: Internal entities/tables can evolve without breaking the public API
- **Type‑safety & DX**: Strong types in controllers/services

#### **Example:**

```typescript
// create-dashboard.dto.ts
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateDashboardDto {
  @IsString() @MaxLength(255)
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsBoolean()
  isPublic?: boolean;
}

// dashboards.controller.ts (usage)
@Post()
async create(@Body() dto: CreateDashboardDto) {
  return this.dashboardsService.create(dto);
}
```

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │   Material  │ │   Redux     │ │   Emotion   │        │
│  │     UI      │ │   Toolkit   │ │   Styling   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/REST API
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (NestJS)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ Controllers │ │  Services   │ │   Modules   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │   GitHub    │ │   Drizzle   │ │   Proxy     │        │
│  │   API       │ │     ORM     │ │  Service    │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
                           │
                           │ SQL Queries
                           ▼
┌─────────────────────────────────────────────────────────┐
│                Database (PostgreSQL)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ Dashboards  │ │ GitHub Users│ │  Widgets    │        │
│  │    Table    │ │    Table    │ │   Table     │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### **Key Architectural Decisions**

**Nx Monorepo Benefits:**

- **Code sharing** - Share types and utilities between projects
- **Consistent tooling** - Same linting, testing, building across projects
- **Dependency management** - Automatic build order and caching
- **Atomic changes** - Modify multiple projects in one commit

**NestJS Design Patterns:**

- **Modules** - Organize code into feature modules
- **Dependency Injection** - Automatic dependency resolution
- **Decorators** - Declarative configuration
- **Separation of Concerns** - Controllers, Services, Repositories

**React + Material-UI:**

- **Component composition** - Build complex UIs from simple components
- **State management** - Redux Toolkit for predictable state updates
- **Theming** - Consistent design system
- **Responsive design** - Mobile-first approach

---

## 📁 **Project Structure**

See the root README for the current repository layout: [README.md](../README.md)

---

## Phase 1: Project Setup ✅

**Goal:** Organize the monorepo structure and create the initial projects.

### **Steps Completed:**

- [x] Reorganize existing projects into test-app folder
- [x] Add @nx/nest dependency
- [x] Plan project structure
- [x] Create NestJS API project
- [x] Create React web project

### **What We Learned:**

- Nx workspace organization patterns
- Project generation with Nx CLI
- Monorepo folder structure best practices

---

## Phase 2: Database Design & Setup

**Goal:** Design and implement a PostgreSQL database with type-safe ORM.

### 🗄️ **Database Schema**

#### **Why PostgreSQL + Drizzle ORM?**

**PostgreSQL** is chosen because:

- **ACID compliance** - Reliable transactions
- **JSONB support** - Store flexible data structures
- **Advanced indexing** - Fast queries on large datasets
- **Extensibility** - Rich ecosystem of extensions

**Drizzle ORM** is chosen because:

- **Type safety** - Full TypeScript support
- **Performance** - Lightweight and fast
- **SQL-like syntax** - Easy to learn and debug
- **Migration system** - Version control for database changes

#### **Database Tables:**

```sql
-- Named dashboards (no authentication needed)
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly name
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GitHub users to track in each dashboard
CREATE TABLE dashboard_github_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  github_username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255), -- optional custom name
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(dashboard_id, github_username)
);

-- Tracked repositories for each dashboard
CREATE TABLE dashboard_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  github_repo_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(dashboard_id, github_repo_id)
);

-- Widget configuration for each dashboard
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  widget_type VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}', -- widget-specific settings
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Setup Challenges We Solved**

#### **Challenge: Postgres Migrations Failing with ECONNREFUSED**

- **Symptom**: Drizzle `db:migrate` failed with `ECONNREFUSED`.
- **Cause**: Postgres container was still starting/not healthy yet.
- **Solution**:
  - Brought up docker compose and waited for healthcheck to pass
  - In Tilt, declared DB as a dependency of the migration and API resources
- **Learning**: Database must accept connections before Drizzle can create the `drizzle` schema and run migrations.

#### **Best Practice: Database Migration Workflow**

**Issue**: When making database schema changes, we should always use proper migration files instead of direct database modifications.

**What Happened**:

- We needed to update the activity type name from `prs_opened` to `prs_created`
- Initially made direct SQL changes: `UPDATE activity_types SET name = 'prs_opened' WHERE name = 'prs_created'`
- This bypassed the proper migration workflow

**Best Practice Solution**:

1. **Create Migration File**: Create a new migration file in `src/database/migrations/`
2. **Write SQL**: Add the necessary SQL commands to the migration file
3. **Run Migration**: Use `pnpm run db:migrate` to apply changes
4. **Version Control**: Migration files are tracked in git for team consistency

**Example Migration File** (`0005_update_activity_type_name.sql`):

```sql
-- Update activity type name from 'prs_opened' to 'prs_created'
UPDATE activity_types SET name = 'prs_created' WHERE name = 'prs_opened';
```

**Why This Matters**:

- **Team Consistency**: All developers get the same database changes
- **Deployment Safety**: Migrations can be applied in production safely
- **Rollback Capability**: Can create rollback migrations if needed
- **Audit Trail**: Clear history of all database changes
- **Environment Parity**: Dev, staging, and production stay in sync

**Migration Commands**:

```bash
# Generate migration from schema changes
pnpm run db:generate

# Apply migrations to database
pnpm run db:migrate

# Sync schema without migrations (for development)
pnpm run db:push

# View database in Drizzle Studio
pnpm run db:studio
```

**Permanent Fix for Migration Conflicts**:
When migration conflicts occur (duplicate migration numbers, corrupted journal), use this reset process:

1. **Drop Migration Schema**: `DROP SCHEMA IF EXISTS drizzle CASCADE;`
2. **Clean Migration Files**: Remove all `000*.sql` files and `meta/` directory
3. **Sync Current Schema**: `pnpm run db:push` to sync database with current schema
4. **Generate Fresh Migration**: `pnpm run db:generate` to create clean migration history

This ensures a clean migration state without losing data.

---

## Phase 3: Development Environment

**Goal:** Set up Tilt for orchestrating all services with hot reloading.

### **Tilt Configuration**

**Tilt** is a development tool that:

- **Orchestrates services** - Starts all needed services with one command
- **Hot reloading** - Automatically restarts services when code changes
- **Service dependencies** - Ensures services start in the correct order
- **Local development** - Simulates production environment locally

#### **Root Tiltfile Strategy**

```python
# Conditional loading based on TILT_RESOURCE environment variable
if os.environ.get('TILT_RESOURCE', '') == 'github-dashboard':
    load('github-dashboard/Tiltfile')
else:
    load('default/Tiltfile')
```

**Why this approach?**

- **Multiple projects** - Different Tilt configurations for different apps
- **Environment isolation** - Each project has its own service definitions
- **Flexibility** - Easy to add new projects without conflicts

#### **Service Orchestration**

```python
# github-dashboard/Tiltfile - Complete service stack

# 1. PostgreSQL Database
docker_compose('postgres', 'docker-compose.yml')

# 2. PostGraphile UI - Database introspection & GraphQL
docker_resource('postgraphile', 'postgraphile/postgraphile:latest', ...)

# 3. NestJS API - Backend with hot reloading
local_resource('github-dashboard-api', serve_cmd='npm run start:dev', ...)

# 4. React Web App - Frontend with Vite
local_resource('github-dashboard-web', serve_cmd='npm run start', ...)

# 5. Database Migrations - Automatic schema setup
local_resource('db-migrate', cmd='npm run db:migrate', ...)
```

#### **PostGraphile Integration**

**What is PostGraphile?**

- **Auto-generates GraphQL API** from PostgreSQL schema
- **Database introspection** - Visual exploration of your database
- **GraphiQL interface** - Interactive GraphQL playground
- **Real-time subscriptions** - WebSocket support for live data

**Why Add PostGraphile?**

- **Database exploration** - Visual way to understand your schema
- **API prototyping** - Quick GraphQL endpoint for testing
- **Schema validation** - Ensure your database design is correct
- **Development tooling** - Great for debugging and development

**PostGraphile Configuration:**

```dockerfile
postgraphile/postgraphile:latest
--connection postgresql://postgres:password@postgres:5432/github_dashboard
--host 0.0.0.0 --port 5000 --cors --enhance-graphiql
```

**Access PostGraphile:**

- **URL**: http://localhost:5000
- **GraphiQL**: http://localhost:5000/graphiql (interactive playground)
- **GraphQL Endpoint**: http://localhost:5000/graphql

**Example Queries:**

```graphql
# List all dashboards
query {
  dashboards {
    id
    name
    description
    isPublic
    createdAt
  }
}

# Get a specific dashboard
query {
  dashboard(id: "1") {
    name
    description
    dashboardGithubUsers {
      githubUsername
    }
  }
}
```

#### **Port Strategy**

- **PostgreSQL**: 5432 (standard)
- **PostGraphile**: 5000 (GraphQL endpoint)
- **NestJS API**: 3001 (REST API)
- **React Web**: 4202 (frontend)
- **Tilt UI**: 10360 (custom to avoid conflicts)

**Why Custom Tilt Port?**

- **Avoid conflicts** - Your work repo might use default port 10350
- **Multiple projects** - Run different Tilt instances simultaneously
- **Team development** - No port conflicts between team members

### **Setup Challenges We Solved**

#### **Challenge: Tilt UI Port Conflict (10350 already in use)**

- **Symptom**: "Tilt cannot start because you already have another process on port 10350".
- **Cause**: Another repo was already running Tilt on the default port 10350.
- **Solution**: Run this project on a custom port using environment variable:
  - Start: `npm run tilt:up:github-dashboard` (sets `TILT_PORT=10360`)
  - Stop: `npm run tilt:down` (stops the 10360 instance)
  - Manual: `TILT_PORT=10360 tilt up|down github-dashboard`
- **Learning**: Tilt's UI port is a process-level setting, not in the Tiltfile. Using a dedicated port prevents collisions with other repos.

#### **Challenge: PostGraphile Resource Visibility in Tilt**

- **Symptom**: PostGraphile URL didn't appear in the Tilt UI or the resource shows as disabled.
- **Cause**: Tilt + docker-compose resource wiring/health ordering. If PostGraphile isn't declared as a compose resource, or it starts before Postgres is healthy, Tilt may hide/disable it.
- **Solution**:
  - Added a `postgraphile` service to `github-dashboard/docker-compose.yml`
  - Used Tilt `docker_compose('github-dashboard/docker-compose.yml')` so Tilt tracks it
  - Ensured Postgres has a healthcheck and PostGraphile depends on it
- **Learning**: This is a Tilt orchestration/health issue rather than a Docker engine issue. Getting the resource into compose and ordering/health right makes it visible and stable in the Tilt UI.

#### **Challenge: Tilt Process Cleanup (EADDRINUSE after tilt down)**

- **Symptom**: `EADDRINUSE: address already in use :::3001` when restarting Tilt.
- **Cause**: `tilt down` stops orchestration but doesn't always kill the underlying processes (NestJS API, React dev server).
- **Debugging Process**:
  1. **Identify what's using the port**:
     ```bash
     lsof -i :3001               # Check what's using port 3001
     lsof -i :4202               # Check what's using port 4202
     ```
  2. **Kill processes on specific ports**:
     ```bash
     lsof -ti tcp:3001 | xargs kill -9  # Kill processes on port 3001
     lsof -ti tcp:4202 | xargs kill -9  # Kill processes on port 4202
     ```
  3. **Alternative: Kill all processes on multiple ports**:
     ```bash
     lsof -ti tcp:3001,4202 | xargs kill -9  # Kill processes on both ports
     ```
- **Learning**:
  - Tilt manages orchestration but not always process lifecycle
  - Node.js processes can persist even after Tilt stops
  - Always use proper process cleanup before restarting Tilt
  - Great example of development environment challenges

#### **Challenge: Nx Process Conflicts**

- **Symptom**: Tilt shows "Waiting for api:serve:development in another nx process" and hangs.
- **Cause**: Multiple Nx processes trying to run the same target simultaneously, often from previous sessions that didn't shut down properly.
- **Debugging Process** (Best Practice):
  1. **List processes first** to identify the conflict:
     ```bash
     ps aux | grep "nx serve"    # Find Nx processes
     lsof -i :3001               # Check what's using port 3001
     lsof -i :4202               # Check what's using port 4202
     ```
  2. **Kill specific processes** based on what you found:
     ```bash
     pkill -f "nx serve"         # Kill Nx serve processes
     pkill -f "nx run"           # Kill Nx run processes
     lsof -ti tcp:3001 | xargs kill -9  # Kill processes on specific ports
     ```
  3. **Restart Tilt**:
     ```bash
     npm run tilt:down
     npm run tilt:up:github-dashboard
     ```
- **Learning**:
  - Nx uses file-based locking to prevent multiple instances of the same target
  - Zombie processes from previous sessions can block new ones
  - Always list processes before killing them to understand root cause

#### **Why `tilt down` Doesn't Kill Nx Processes**

- **Root Cause**: Tilt's process management limitations:
  - **Tilt's scope**: Only manages processes it directly spawns
  - **Independent processes**: Nx processes started manually (outside Tilt) are not tracked
  - **Process persistence**: Node.js processes can outlive their parent processes
  - **Nx file locking**: Nx uses file-based locking that persists even after Tilt stops
- **Prevention strategies**:
  - **Always use Tilt**: Never run `nx serve` commands manually when using Tilt
  - **Clean shutdown**: Use proper process cleanup before starting Tilt
  - **Process monitoring**: Regularly check for zombie processes with `ps aux | grep nx`
- **Future consideration**: When migrating to pnpm, process management and locking behavior may change

---

## Phase 4: Backend Development

**Goal:** Implement NestJS API with GitHub integration and database operations.

### **Implementation Steps:**

- Set up NestJS modules and controllers
- Implement GitHub API proxy service
- Create CRUD operations for dashboards
- Add data validation and error handling

### **Challenges & Solutions**

#### **Challenge: Nx Pruned Lockfile Errors**

- **Symptom**: Errors like "The following package was not found in the root lock file" for `@nestjs/mapped-types`, `class-transformer`, `class-validator`.
- **Cause**: Nx creates pruned lockfiles per project; dependencies used by projects must exist in the root `package.json` lockfile.
- **Solution**: Added missing packages to the root devDependencies and re-ran install to update the root lockfile.
- **Learning**: Keeps Nx's pruned lockfile generation consistent across projects in the monorepo.

#### **Challenge: API Route Double Prefix (`/api/api`)**

- **Symptom**: 404/connection issues; routes seemed to be under `/api/api`.
- **Cause**: `main.ts` set a global prefix `api` and `AppController` was also decorated as `@Controller('api')`.
- **Solution**: Removed `'api'` from `AppController` to avoid duplicate prefix.
- **Learning**: Keep one source of truth for the base API path.

#### **Challenge: CORS Policy Issue**

- **Symptom**: Frontend gets blocked by CORS policy when trying to access API endpoints.
- **Error**: `Access to fetch at 'http://localhost:3001/api/dashboards' from origin 'http://localhost:4202' has been blocked by CORS policy`
- **Solution**: Enable CORS in `main.ts`:
  ```typescript
  app.enableCors({
    origin: ['http://localhost:4202', 'http://localhost:4201'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  ```
- **Learning**: CORS is a browser security feature that prevents malicious websites from accessing APIs. In development, we need to explicitly allow our frontend to access our backend.

#### **Challenge: pnpm Migration Bug Discovery (Major Learning)**

- **Symptom**: After migrating from npm to pnpm, the API started failing with "WebSockets request was expected" error.
- **Root Cause**: pnpm's stricter dependency resolution exposed existing architectural bugs that npm had been hiding.
- **The Hidden Bugs**:
  1. **Wrong import path**: `'./base.repository'` instead of `'../base.repository'` in `DashboardUserRepository`
  2. **Missing constructor**: `DashboardUserRepository` extended `BaseRepository` but didn't call `super(table)`
  3. **Missing DatabaseModule**: No global database module for dependency injection
- **Why npm vs pnpm behaved differently**:
  - **npm**: More permissive dependency resolution, would find packages even if not explicitly declared
  - **pnpm**: Stricter dependency resolution, requires explicit declarations, exposes import path issues immediately
- **The Fix Sequence**:
  1. Fixed import path: `'./base.repository'` → `'../base.repository'`
  2. Added proper constructor: `constructor() { super(dashboardGithubUsers); }`
  3. Created `DatabaseModule` with `@Global()` decorator
  4. Added `@Injectable()` decorators to repositories
- **Key Learning**:
  - **pnpm is actually better** - it catches bugs that npm hides
  - **Dependency injection requires proper setup** - NestJS needs explicit module configuration
  - **Import paths matter** - webpack builds fail with incorrect relative paths
  - **Constructor chaining is required** - when extending classes, you must call `super()` with required parameters

#### **Challenge: Avatar URL Issues and GitHub User ID Usage**

- **Issue**: Avatar URLs were not displaying correctly, especially for bot users with special characters in usernames.
- **Root Cause**:
  - Avatar URLs were being generated using usernames instead of GitHub user IDs
  - Some users had temporary IDs (`temp_*`) instead of real GitHub user IDs
  - Bot usernames with special characters like `[bot]` caused URL encoding issues
- **Solution Applied**:
  1. **Used GitHub User IDs**: Updated avatar URL generation to use `https://avatars.githubusercontent.com/u/${user.githubUserId}?v=4`
  2. **Fixed Bot Users**: Bot users use `/in/` path instead of `/u/` path in GitHub's avatar system
  3. **Database Migrations**: Created proper migration files to update all user avatar URLs
  4. **Immutable IDs**: GitHub user IDs are immutable while usernames can change, making them more reliable
- **Key Learning**: Always use GitHub user IDs for avatar URLs, not usernames, especially for bot accounts.

---

## Phase 5: Frontend Development

**Goal:** Build React UI with Material-UI and connect to backend API.

### **Implementation Steps:**

- Set up Material-UI theme
- Implement Redux Toolkit store
- Create dashboard builder components
- Add data visualization charts

### **Challenges & Solutions**

#### **Challenge: Dashboard Users Not Persisting + Rate Limiting**

- **Symptom**: Users added to dashboards in the frontend don't save to the database, and GitHub API rate limits are hit quickly.
- **Root Cause**:
  1. **Missing API endpoints**: Frontend was only updating local state, not calling backend APIs to persist users
  2. **No rate limiting strategy**: GitHub API has strict limits (60 requests/hour unauthenticated, 5000/hour with PAT)
- **The Workaround Implementation**:
  1. **Added Dashboard User Management APIs**:
     ```typescript
     // New endpoints added to DashboardsController
     POST /api/dashboards/:id/users          // Add user to dashboard
     DELETE /api/dashboards/:id/users/:username  // Remove user from dashboard
     GET /api/dashboards/:id/users           // Get dashboard users
     ```
  2. **Created RateLimitService**:
     ```typescript
     // Tracks GitHub API rate limits from response headers
     // Provides user-friendly error messages
     // Prevents requests when limits are exceeded
     ```
  3. **Enhanced GitHubService**:
     ```typescript
     // Uses makeRateLimitedRequest() wrapper
     // Updates rate limit info from response headers
     // Throws 429 errors with helpful messages
     ```
- **Frontend Integration Needed**:
  - Update `addUserToDashboard()` to call `POST /api/dashboards/:id/users`
  - Update `loadDashboardUsers()` to call `GET /api/dashboards/:id/users`
  - Handle 429 rate limit errors gracefully
- **Rate Limiting Strategies**:
  - **Immediate**: Rate limit tracking and user-friendly error messages
  - **Short-term**: Add GitHub Personal Access Token (PAT) for 5000 requests/hour
  - **Long-term**: Implement OAuth for user-specific rate limits
- **Key Learning**:
  - **API design matters**: Frontend and backend must be in sync for data persistence
  - **Rate limiting is critical**: External APIs have strict limits that must be respected
  - **User experience**: Clear error messages help users understand what's happening
  - **Progressive enhancement**: Start with basic functionality, add authentication later

#### **Challenge: Enhanced Review Counting with Emoji Reactions**

- **Enhancement**: Added emoji reaction counting to the review metrics to provide more comprehensive activity tracking.
- **What Was Added**:
  - **Emoji Reactions**: Now counts 👍, ❤️, 😄, 🎉, 👀, 🚀 reactions on PRs
  - **Date Range Filtering**: Emoji reactions are filtered by the same date range as reviews
  - **Parallel API Calls**: Reviews and reactions are fetched in parallel for better performance
  - **Comprehensive Logging**: Enhanced logging shows both review and reaction activity
- **Technical Implementation**:
  - Added `getPullRequestReactions()` method using GitHub's `/issues/{number}/reactions` endpoint
  - Updated `getUserReviewCount()` to include both formal reviews and emoji reactions
  - Maintains unique PR counting (1 PR = 1 count, regardless of multiple reactions)
- **Result**: Users now get credit for both formal code reviews and emoji reactions, providing a more complete picture of their engagement with PRs.

#### **Challenge: Performance & UX Optimizations**

- **Symptom**: First-time activity loads took ~9–12s.
- **Changes Made**:
  - **Repo-first aggregation**: When reviews are off, only 2 GitHub Search calls per repo (created, merged); counts reduced by author and cached
  - **include_reviews flag**: Skip review/reaction calls unless enabled
  - **Short SWR cache**: For assembled batch and sessionStorage hydration for instant first paint
  - **Two-stage fetch**: Fast pass (no reviews) → full pass (per configuration) with an "Updating…" indicator
  - **Server loads repos from DB**: Frontend no longer needs to pass repos if none provided
- **Result**: Faster perceived load, fewer calls, stable UX. Cold loads remain bounded by GitHub Search latency.

---

## 🚀 **Quick Start Guide**

### **Prerequisites:**

- Node.js 18+ and pnpm installed
- Docker Desktop running
- Tilt CLI installed (`brew install tilt-dev/tap/tilt`)

### **Setup & Run:**

```bash
# 1. Clone and install dependencies
git clone <your-repo>
cd <repo-name>
pnpm install

# 2. Start the development environment
npm run tilt:up:github-dashboard

# 3. Access services
# - Tilt UI: http://localhost:10360
# - API: http://localhost:3001
# - Web: http://localhost:4202
# - PostGraphile: http://localhost:5000
# - Postgres: localhost:5432

# 4. Stop everything
npm run tilt:down
```

### **First Time Setup:**

```bash
# Run database migrations
pnpm run db:migrate

# View database in Drizzle Studio
pnpm run db:studio
```

---

## 🔧 **Development Commands**

### **Tilt Commands**

```bash
# Start GitHub Dashboard stack
npm run tilt:up:github-dashboard

# Stop Tilt
npm run tilt:down

# List all Tilt resources and their status
TILT_PORT=10360 tilt get uiresources

# Check logs for a specific resource
TILT_PORT=10360 tilt logs <resource-name>

# Enable/disable a resource
TILT_PORT=10360 tilt enable <resource-name>
TILT_PORT=10360 tilt disable <resource-name>

# Trigger a resource update
TILT_PORT=10360 tilt trigger <resource-name>

# Check resource status in detail
TILT_PORT=10360 tilt get uiresources -o yaml
```

### **When to Use These Commands**

- **`tilt get uiresources`**: When services aren't starting or you need to see what resources exist
- **`tilt logs <resource>`**: When a service is failing or not behaving as expected
- **`tilt enable/disable`**: When services are auto-disabled (common with docker-compose)
- **`tilt trigger`**: When you need to force restart a specific service

### **Database Commands**

```bash
# Generate migration from schema changes
pnpm run db:generate

# Apply migrations to database
pnpm run db:migrate

# Sync schema without migrations (for development)
pnpm run db:push

# View database in Drizzle Studio
pnpm run db:studio
```

### **Process Management**

```bash
# Check what's using a port
lsof -i :3001               # API port
lsof -i :4202               # Web port
lsof -i :5000               # PostGraphile port

# Kill processes on specific ports
lsof -ti tcp:3001 | xargs kill -9
lsof -ti tcp:4202 | xargs kill -9

# Kill multiple ports at once
lsof -ti tcp:3001,4202 | xargs kill -9

# Find Nx processes
ps aux | grep "nx serve"
pkill -f "nx serve"
```

---

## 🌐 **Service Access Guide**

### **Service Ports**

| Service          | Port  | URL                    | Purpose                |
| ---------------- | ----- | ---------------------- | ---------------------- |
| **Tilt UI**      | 10360 | http://localhost:10360 | Development dashboard  |
| **NestJS API**   | 3001  | http://localhost:3001  | REST API backend       |
| **React Web**    | 4202  | http://localhost:4202  | Frontend application   |
| **PostGraphile** | 5000  | http://localhost:5000  | GraphQL API & GraphiQL |
| **PostgreSQL**   | 5432  | localhost:5432         | Database               |

### **API Endpoints**

```bash
# Health check
GET http://localhost:3001/api/health

# Dashboard endpoints
GET    http://localhost:3001/api/dashboards
POST   http://localhost:3001/api/dashboards
GET    http://localhost:3001/api/dashboards/:id
PUT    http://localhost:3001/api/dashboards/:id
DELETE http://localhost:3001/api/dashboards/:id

# Dashboard users
GET    http://localhost:3001/api/dashboards/:id/users
POST   http://localhost:3001/api/dashboards/:id/users
DELETE http://localhost:3001/api/dashboards/:id/users/:username
```

### **PostGraphile GraphQL**

Access the GraphiQL playground at http://localhost:5000/graphiql to explore your database schema interactively.

**Example Queries:**

```graphql
# List all dashboards
query {
  dashboards {
    id
    name
    description
    isPublic
    createdAt
  }
}

# Get a specific dashboard with users
query {
  dashboard(id: "1") {
    name
    description
    dashboardGithubUsers {
      githubUsername
      displayName
    }
  }
}
```

---

## 🤖 **Building with LLM: What I Learned**

### **The Reality of AI-Assisted Development**

Building this project with LLM/Cursor taught me that **AI is a powerful accelerator, but understanding fundamentals is still critical**. Here's what I discovered:

### **Where LLM Helped:**

1. **Rapid Scaffolding**: Generated boilerplate code for NestJS modules, React components, and database schemas in seconds
2. **Pattern Recognition**: Suggested best practices for NestJS architecture (Controller → Service → Repository pattern)
3. **Configuration Files**: Created complex configurations (Tiltfile, docker-compose.yml, Drizzle schema) with proper syntax
4. **Documentation**: Helped structure and explain technical concepts clearly
5. **Debugging Assistance**: Suggested solutions for error messages and stack traces

### **Where LLM Created Confusion:**

1. **Hidden Bugs**: npm vs pnpm migration revealed that LLM had been generating code with incorrect import paths that npm tolerated but pnpm exposed
2. **Architectural Inconsistencies**: Sometimes suggested patterns that conflicted with NestJS best practices (e.g., wrong use of decorators)
3. **Incomplete Solutions**: Would generate code that compiled but didn't actually work (e.g., missing `super()` calls in constructors)
4. **Over-Engineering**: Suggested complex solutions when simple ones would work better
5. **Copy-Paste Without Understanding**: Easy to accept code without fully understanding what it does

### **The Critical Lesson:**

**You MUST understand the fundamentals to use LLM effectively.** Without understanding:

- **You can't spot bugs** - The pnpm migration bugs existed from the start, but I didn't catch them until the stricter package manager exposed them
- **You can't debug effectively** - When things break, you need to understand the architecture to fix them
- **You can't make good decisions** - LLM suggestions are just that—suggestions. You need to evaluate if they're right for your use case
- **You can't learn** - Just copy-pasting code means you're not building mental models

### **Best Practices for AI-Assisted Development:**

1. **Learn the fundamentals first** - Understand TypeScript, NestJS patterns, React hooks, SQL basics
2. **Read the generated code** - Don't just accept it. Understand every line
3. **Ask "why"** - When LLM suggests something, ask why that pattern is used
4. **Test incrementally** - Don't generate large chunks. Build and test small pieces
5. **Use LLM for research** - Ask it to explain concepts, compare approaches, show examples
6. **Verify with official docs** - LLM can hallucinate. Always cross-reference with real documentation
7. **Keep a learning log** - Document what you learned, not just what you built (this document!)

### **The Value of This Approach:**

This project is more valuable because I documented the journey, including:

- **Mistakes made** - Learning from errors is more valuable than perfect code
- **Why decisions were made** - Context matters for future maintenance
- **What LLM did well and poorly** - Helps calibrate future LLM usage
- **Real troubleshooting** - Shows the messy reality of development

**Bottom line:** LLM is like having a senior developer pair programming with you, but **you** are still the one who needs to understand the code and make the final decisions.

---

## 🎓 **Key Technical Learnings**

### **1. Process Management & Development Tools**

**The Saga of Tilt, Nx, and Zombie Processes:**

One of the biggest learnings was understanding how development tools manage processes:

- **Tilt orchestrates, but doesn't own processes** - When you run `tilt down`, it stops the orchestration layer but doesn't necessarily kill the underlying Node.js processes
- **Nx uses file-based locking** - Multiple `nx serve` commands can conflict if previous processes didn't clean up properly
- **Process persistence is normal** - Node.js processes can outlive their parent processes, leading to port conflicts
- **Always check before assuming** - Use `lsof` and `ps` to understand what's actually running before killing processes

**Key Commands to Remember:**

```bash
# Always check first
lsof -i :3001
ps aux | grep "nx serve"

# Then kill specifically
lsof -ti tcp:3001 | xargs kill -9
pkill -f "nx serve"
```

### **2. Package Managers Matter**

**npm vs pnpm: The Great Revelation:**

Migrating from npm to pnpm exposed hidden bugs that had been lurking in the codebase:

- **npm is permissive** - Will find packages even if not explicitly declared, hides import path errors
- **pnpm is strict** - Requires explicit declarations, immediately exposes incorrect import paths
- **Stricter is better** - pnpm caught bugs that would have caused issues in production
- **Dependency injection needs proper setup** - NestJS requires explicit module configuration, can't rely on package manager to "figure it out"

**The Bugs That Were Hidden:**

1. Wrong import paths (`'./base.repository'` instead of `'../base.repository'`)
2. Missing constructor calls (`super(table)` not called in extended classes)
3. Missing `@Injectable()` decorators on repositories
4. No global `DatabaseModule` for dependency injection

**Learning:** Package managers are not just about installing packages—they enforce architectural correctness.

**Bonus Learning - Exit Code Handling:**

When stopping Tilt with `Ctrl+C`:

- **npm**: Treats `SIGINT` as graceful shutdown, exits cleanly
- **pnpm**: Reports `ELIFECYCLE Command failed with exit code 1`

**Is this a problem?** No - it's just pnpm being more verbose about process termination. Tilt still stops correctly, no services are left running. It's cosmetic, not functional.

**Why pnpm does this:** Stricter exit code handling is actually better for CI/CD (catches real failures), but can be annoying in local development.

**Workaround if it bothers you:**

```bash
# Use the stop script instead
pnpm run tilt:down

# Or modify package.json to ignore exit codes
"tilt:up:github-dashboard": "TILT_PORT=10360 TILT_RESOURCE=github-dashboard tilt up || true"
```

### **3. Database Migrations Are Non-Negotiable**

**The Right Way to Change Database Schema:**

Early in the project, I made direct SQL changes to fix data issues. This was wrong.

**Why Migrations Matter:**

- **Team consistency** - Everyone gets the same changes
- **Deployment safety** - Can be applied in production reliably
- **Audit trail** - Clear history of all database changes
- **Rollback capability** - Can create rollback migrations if needed
- **Environment parity** - Dev, staging, production stay in sync

**The Right Process:**

1. Update Drizzle schema files
2. Run `pnpm run db:generate` to create migration
3. Review the generated SQL
4. Run `pnpm run db:migrate` to apply
5. Commit migration files to git

**Emergency Reset (if migrations get corrupted):**

```sql
DROP SCHEMA IF EXISTS drizzle CASCADE;
-- Then: pnpm run db:push && pnpm run db:generate
```

### **4. External API Integration**

**GitHub API: Rate Limiting & Data Fetching:**

Integrating with GitHub's API taught several important lessons:

**Rate Limiting Strategy:**

- **Unauthenticated**: 60 requests/hour (very limiting)
- **Personal Access Token**: 5000 requests/hour (workable)
- **OAuth**: Per-user limits (best for production)

**Implementation Insights:**

- **Track rate limits from headers** - GitHub returns `X-RateLimit-*` headers on every response
- **Fail gracefully** - Provide clear error messages when limits are hit
- **Cache aggressively** - Use SWR and sessionStorage to reduce API calls
- **Batch operations** - Fetch multiple items in single requests when possible
- **Progressive enhancement** - Start with basic functionality, add auth later

**Performance Optimizations:**

- Repo-first aggregation reduced API calls by 3-5x
- Two-stage fetch (fast pass → full pass) improved perceived performance
- Server-side caching reduced redundant GitHub API calls

### **5. CORS Is Always a Thing**

**Cross-Origin Resource Sharing:**

When building separate frontend and backend servers, CORS will bite you:

**The Problem:**

```
Access to fetch at 'http://localhost:3001/api/dashboards' from origin
'http://localhost:4202' has been blocked by CORS policy
```

**The Solution:**

```typescript
// In main.ts
app.enableCors({
  origin: ['http://localhost:4202'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

**Learning:** Always configure CORS in development. In production, be more restrictive with allowed origins.

### **6. Avatar URLs & Immutable Identifiers**

**Use IDs, Not Usernames:**

Early implementation used GitHub usernames for avatar URLs. This caused problems:

**Problems with Usernames:**

- Users can change their username (mutable identifier)
- Bot users have special characters (`[bot]`) that break URLs
- URL encoding becomes complex

**Solution:**

```typescript
// Bad: username-based (mutable)
https://github.com/${username}.png

// Good: user ID-based (immutable)
https://avatars.githubusercontent.com/u/${userId}?v=4
```

**Learning:** Always use immutable identifiers (IDs) for API references, not human-readable names.

### **7. Emoji Reactions Count Too**

**Comprehensive Activity Tracking:**

Initially only counted formal PR reviews. But GitHub engagement includes emoji reactions (👍, ❤️, 🎉, etc.)

**Implementation:**

- Fetch reactions from `/issues/{number}/reactions` endpoint
- Filter by date range (same as reviews)
- Count unique PRs (don't double-count)
- Run in parallel with review fetching

**Learning:** Real-world engagement is multifaceted. Don't just track formal actions; track informal ones too.

### **8. NestJS Architecture Patterns**

**The Controller → Service → Repository Pattern:**

Understanding this separation took time, but it's crucial:

**Controller** (HTTP Boundary):

- Parse request
- Validate input (DTOs)
- Call service
- Format response
- **Keep it thin**

**Service** (Business Logic):

- Implement use cases
- Orchestrate repositories
- Handle business rules
- **No HTTP concerns**

**Repository** (Data Access):

- Encapsulate queries
- Abstract database details
- Return domain objects
- **No business logic**

**Why This Matters:**

- **Testability** - Each layer can be tested independently
- **Maintainability** - Clear responsibilities, easy to find code
- **Flexibility** - Can swap implementations without changing other layers

---

## 📖 **Resources for Learning**

### **Official Documentation:**

- [Nx Documentation](https://nx.dev/) - Monorepo management
- [NestJS Documentation](https://docs.nestjs.com/) - Backend framework
- [Material-UI Documentation](https://mui.com/) - React components
- [Drizzle ORM Documentation](https://orm.drizzle.team/) - Database ORM
- [Tilt Documentation](https://docs.tilt.dev/) - Development orchestration
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database
- [GitHub API Documentation](https://docs.github.com/en/rest) - API reference

### **Key Concepts to Study:**

- **TypeScript Advanced Types** - Generics, utility types, type inference
- **Dependency Injection** - How NestJS DI container works
- **SQL & Query Optimization** - Joins, indexes, query planning
- **REST API Design** - HTTP methods, status codes, versioning
- **React Hooks** - useState, useEffect, custom hooks
- **Redux Toolkit** - Slices, reducers, async thunks
- **Docker & Containers** - Images, volumes, networking
- **Process Management** - Signals, lifecycle, orchestration

### **Books Worth Reading:**

- _Learning SQL_ by Alan Beaulieu
- _Designing Data-Intensive Applications_ by Martin Kleppmann
- _The Pragmatic Programmer_ by Hunt & Thomas
- _Clean Architecture_ by Robert C. Martin

### **Practice Projects:**

- Build a REST API with NestJS from scratch
- Create a React app without tutorials (just docs)
- Set up a monorepo with Nx
- Deploy a full-stack app to production

---

## 🎯 **Next Steps**

### **Future Enhancements:**

**Short Term:**

- [ ] Add user authentication (OAuth with GitHub)
- [ ] Implement dashboard sharing functionality
- [ ] Add more widget types (burndown charts, velocity)
- [ ] Improve error handling and user feedback

**Medium Term:**

- [ ] Real-time updates with WebSockets
- [ ] Export dashboard data (PDF, CSV)
- [ ] Team collaboration features
- [ ] Custom date range filtering

**Long Term:**

- [ ] AI-powered insights and recommendations
- [ ] Integration with other platforms (GitLab, Bitbucket)
- [ ] Mobile app
- [ ] Self-hosted deployment option

### **Technical Debt:**

- [ ] Add comprehensive test coverage (unit, integration, e2e)
- [ ] Implement proper error logging and monitoring
- [ ] Add API rate limiting on backend
- [ ] Optimize database queries with indexes
- [ ] Add caching layer (Redis)
- [ ] Document API with OpenAPI/Swagger

---

## 🙏 **Acknowledgments**

This project was built with the assistance of:

- **Claude (Anthropic)** - AI pair programming and architecture guidance
- **Cursor** - AI-powered code editor
- **Stack Overflow Community** - Problem-solving and debugging help
- **Open Source Maintainers** - For the amazing tools used in this project

---

_This document is a living record of my learning journey. It will continue to be updated as I learn more, discover new patterns, and solve new problems. The goal is not perfection, but understanding._

**Last Updated:** October 2025  
**Project Status:** In Active Development  
**Current Phase:** Phase 5 - Frontend Development
