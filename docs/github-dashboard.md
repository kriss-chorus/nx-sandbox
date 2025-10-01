# 🐙 GitHub Dashboard - Full Stack Learning Journey

## 📚 **Learning Objectives**

This project demonstrates building a modern full-stack application using:
- **Nx Monorepo** - Managing multiple projects in one repository
- **NestJS** - Enterprise-grade Node.js backend framework
- **React + Material-UI** - Modern frontend with component library
- **PostgreSQL + Drizzle ORM** - Type-safe database operations
- **Tilt** - Development environment orchestration
- **Docker** - Containerization for services

## 🎯 **Project Overview**

**GitHub Dashboard Builder** - A web application that allows users to create custom dashboards tracking GitHub activity for multiple developers and repositories.

### **Key Features:**
- 📊 **Dashboard Builder** - Create custom dashboards with widgets
- 👥 **Multi-User Tracking** - Track multiple GitHub users in one dashboard
- 📂 **Repository Management** - Add/remove repositories to track
- 📈 **Data Visualization** - Charts and graphs for GitHub statistics
- 🔗 **GitHub API Integration** - Real-time data from GitHub API
- 🎨 **Customizable UI** - Drag-and-drop widget arrangement

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

## 📁 **Project Structure**

```
nx-sandbox/
├── packages/
│   ├── common/                    # Shared utilities (existing)
│   ├── test-app/                  # Legacy projects (existing)
│   │   ├── api/                   # Express API (reference)
│   │   └── client/                # React client (reference)
│   │
│   └── github-dashboard/          # NEW: GitHub Dashboard
│       ├── api/                   # NestJS Backend
│       │   ├── src/
│       │   │   ├── modules/       # Feature modules
│       │   │   ├── database/      # Drizzle ORM setup
│       │   │   ├── github/        # GitHub API integration
│       │   │   └── main.ts        # Application entry point
│       │   └── Dockerfile
│       │
│       └── web/                   # React Frontend
│           ├── src/
│           │   ├── components/    # React components
│           │   ├── pages/         # Application pages
│           │   ├── store/         # Redux store
│           │   └── services/      # API services
│           └── Dockerfile
│
├── github-dashboard/
│   ├── Tiltfile                   # Development orchestration
│   ├── docker-compose.yml         # Database services
│   └── .env.example              # Environment variables
│
└── Tiltfile                       # Main orchestrator
```

## 🗄️ **Database Schema**

### **Why PostgreSQL + Drizzle ORM?**

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

### **Database Tables:**

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

## 🚀 **Development Workflow**

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

## 🧩 Troubleshooting & Challenges Log

This section captures issues encountered during setup and how we resolved them, with rationale for future reference.

### 1) Tilt UI port conflict (10350 already in use)
- **Symptom**: "Tilt cannot start because you already have another process on port 10350".
- **Cause**: Another repo was already running Tilt on the default port 10350.
- **Fix**: Run this project on a custom port using environment variable:
  - Start: `npm run tilt:up:github-dashboard` (sets `TILT_PORT=10360`)
  - Stop: `npm run tilt:down` (stops the 10360 instance)
  - Manual: `TILT_PORT=10360 tilt up|down github-dashboard`
- **Why**: Tilt’s UI port is a process-level setting, not in the Tiltfile. Using a dedicated port prevents collisions with other repos.

### 2) Postgres migrations failing with ECONNREFUSED
- **Symptom**: Drizzle `db:migrate` failed with `ECONNREFUSED`.
- **Cause**: Postgres container was still starting/not healthy yet.
- **Fix**: Ensure DB is healthy before migrations.
  - Brought up docker compose and waited for healthcheck to pass, then re-ran migrations.
  - In Tilt, declared DB as a dependency of the migration and API resources.
- **Why**: Database must accept connections before Drizzle can create the `drizzle` schema and run migrations.

### 3) Nx pruned lockfile errors
- **Symptom**: Errors like "The following package was not found in the root lock file" for `@nestjs/mapped-types`, `class-transformer`, `class-validator`.
- **Cause**: Nx creates pruned lockfiles per project; dependencies used by projects must exist in the root `package.json` lockfile.
- **Fix**: Added missing packages to the root devDependencies and re-ran install to update the root lockfile.
- **Why**: Keeps Nx’s pruned lockfile generation consistent across projects in the monorepo.

### 4) API route double prefix (`/api/api`)
- **Symptom**: 404/connection issues; routes seemed to be under `/api/api`.
- **Cause**: `main.ts` set a global prefix `api` and `AppController` was also decorated as `@Controller('api')`.
- **Fix**: Removed `'api'` from `AppController` to avoid duplicate prefix.
- **Why**: Keep one source of truth for the base API path.

### 5) PostGraphile in Tilt (resource/health visibility)
- Symptom: PostGraphile URL didn’t appear in the Tilt UI or the resource shows as disabled.
- Root cause: Tilt + docker-compose resource wiring/health ordering. If PostGraphile isn’t declared as a compose resource, or it starts before Postgres is healthy, Tilt may hide/disable it.
- Fix applied: Added a `postgraphile` service to `github-dashboard/docker-compose.yml` and used Tilt `docker_compose('github-dashboard/docker-compose.yml')` so Tilt tracks it. Ensure Postgres has a healthcheck and PostGraphile depends on it. URL defaults to `http://localhost:5000`.
- Why: This is a Tilt orchestration/health issue rather than a Docker engine issue. Getting the resource into compose and ordering/health right makes it visible and stable in the Tilt UI.

### 6) Tilt process cleanup (EADDRINUSE after tilt down)
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
- **Why**: Tilt manages orchestration but not always process lifecycle. Node.js processes can persist even after Tilt stops.
- **Prevention**: Always use proper process cleanup before restarting Tilt.
- **Demo Value**: Great example of development environment challenges and the need for robust process management.

### 7) Nx process conflicts ("Waiting for api:serve:development in another nx process")
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
- **Why**: Nx uses file-based locking to prevent multiple instances of the same target. Zombie processes from previous sessions can block new ones.
- **Learning Value**: Always list processes before killing them to understand the root cause and avoid killing unrelated processes.

### 8) Why `tilt down` doesn't kill Nx processes
- **Symptom**: After running `tilt down`, Nx processes still run and cause conflicts on restart.
- **Root Cause**: Tilt's process management limitations:
  - **Tilt's scope**: Only manages processes it directly spawns (Docker containers, local processes started by Tilt)
  - **Independent processes**: Nx processes started manually (outside Tilt) are not tracked by Tilt
  - **Process persistence**: Node.js processes can outlive their parent processes
  - **Nx file locking**: Nx uses file-based locking that persists even after Tilt stops
- **Why this happens**:
  1. **Manual execution**: Running `nx serve api` or `nx serve web` manually creates independent processes
  2. **Tilt's tracking**: Tilt only tracks processes it directly controls
  3. **Process lifecycle**: Node.js processes don't automatically terminate when their parent stops
  4. **File-based locking**: Nx creates lock files that prevent new instances
- **Prevention strategies**:
  - **Always use Tilt**: Never run `nx serve` commands manually when using Tilt
  - **Clean shutdown**: Use proper process cleanup before starting Tilt
  - **Process monitoring**: Regularly check for zombie processes with `ps aux | grep nx`
- **Learning Value**: Understanding the difference between orchestration tools (Tilt) and process management helps prevent conflicts and ensures clean development environments.
- **Future consideration**: When migrating to pnpm, process management and locking behavior may change, potentially affecting how Nx processes are handled and whether this issue persists.

### 9) PostGraphile auto-disable issue (see #5)
- This is the same underlying problem as section 5 (Tilt resource/health ordering). If it auto-disables:
  - Confirm PostGraphile is part of `docker_compose('github-dashboard/docker-compose.yml')`
  - Verify Postgres healthcheck and PostGraphile dependency
  - Manually re-enable if needed: `TILT_PORT=10360 tilt enable postgraphile`

### 10) CORS Policy Issue (Minor Problem)
- **Symptom**: Frontend gets blocked by CORS policy when trying to access API endpoints.
- **Error**: `Access to fetch at 'http://localhost:3001/api/dashboards' from origin 'http://localhost:4202' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- **Root Cause**: NestJS backend doesn't have CORS enabled by default for cross-origin requests.
- **Fix**: Enable CORS in `main.ts`:
  ```typescript
  app.enableCors({
    origin: ['http://localhost:4202', 'http://localhost:4201'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  ```
- **When to Remember**: Always enable CORS when building full-stack applications with separate frontend and backend servers.
- **Learning Value**: CORS is a browser security feature that prevents malicious websites from accessing APIs. In development, we need to explicitly allow our frontend to access our backend.

### 11) pnpm Migration Bug Discovery (Major Learning)
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
- **Learning Value**: 
  - **pnpm is actually better** - it catches bugs that npm hides
  - **Dependency injection requires proper setup** - NestJS needs explicit module configuration
  - **Import paths matter** - webpack builds fail with incorrect relative paths
  - **Constructor chaining is required** - when extending classes, you must call `super()` with required parameters
- **When to Remember**: Package manager migrations can reveal hidden architectural issues. Use this as an opportunity to fix underlying problems rather than just making it work.

### 12) Dashboard Users Not Persisting + Rate Limiting Workarounds (Real-World Issues)

### 13) Database Migration Best Practices (Important Learning)

**Issue**: When making database schema changes, we should always use proper migration files instead of direct database modifications.

**What Happened**: 
- We needed to update the activity type name from `prs_opened` to `prs_created` in the database
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

### 14) Avatar URL Issues and GitHub User ID Usage (Important Learning)

**Issue**: Avatar URLs were not displaying correctly, especially for bot users with special characters in usernames.

**Root Cause**: 
- Avatar URLs were being generated using usernames instead of GitHub user IDs
- Some users had temporary IDs (`temp_*`) instead of real GitHub user IDs
- Bot usernames with special characters like `[bot]` caused URL encoding issues

**Solution Applied**:
1. **Used GitHub User IDs**: Updated avatar URL generation to use `https://avatars.githubusercontent.com/u/${user.githubUserId}?v=4`
2. **Fixed Bot Users**: Bot users use `/in/` path instead of `/u/` path in GitHub's avatar system
3. **Database Migrations**: Created proper migration files to update all user avatar URLs
4. **Immutable IDs**: GitHub user IDs are immutable while usernames can change, making them more reliable

**Key Learning**: Always use GitHub user IDs for avatar URLs, not usernames, especially for bot accounts.

### 15) Enhanced Review Counting with Emoji Reactions (Feature Enhancement)

**Enhancement**: Added emoji reaction counting to the review metrics to provide more comprehensive activity tracking.

**What Was Added**:
- **Emoji Reactions**: Now counts 👍, ❤️, 😄, 🎉, 👀, 🚀 reactions on PRs
- **Date Range Filtering**: Emoji reactions are filtered by the same date range as reviews
- **Parallel API Calls**: Reviews and reactions are fetched in parallel for better performance
- **Comprehensive Logging**: Enhanced logging shows both review and reaction activity

**Technical Implementation**:
- Added `getPullRequestReactions()` method using GitHub's `/issues/{number}/reactions` endpoint
- Updated `getUserReviewCount()` to include both formal reviews and emoji reactions
- Maintains unique PR counting (1 PR = 1 count, regardless of multiple reactions)

**Result**: Users now get credit for both formal code reviews and emoji reactions, providing a more complete picture of their engagement with PRs.

### 16) Dashboard Users Not Persisting + Rate Limiting Workarounds (Real-World Issues)
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
- **Learning Value**: 
  - **API design matters**: Frontend and backend must be in sync for data persistence
  - **Rate limiting is critical**: External APIs have strict limits that must be respected
  - **User experience**: Clear error messages help users understand what's happening
  - **Progressive enhancement**: Start with basic functionality, add authentication later
- **When to Remember**: Always implement proper API endpoints for data persistence, and always respect external API rate limits with proper error handling.

### 17) Performance & UX learnings (Batch activity)
- Symptom: First-time activity loads took ~9–12s.
- Changes:
  - Repo-first aggregation (when reviews are off): only 2 GitHub Search calls per repo (created, merged); counts reduced by author and cached.
  - include_reviews flag to skip review/reaction calls unless enabled.
  - Short SWR cache for assembled batch and sessionStorage hydration for instant first paint.
  - Two-stage fetch on the web: fast pass (no reviews) → full pass (per configuration) with an “Updating…” indicator.
  - Server loads repos from DB if none provided; frontend no longer needs to pass repos.
- Result: Faster perceived load, fewer calls, stable UX. Cold loads remain bounded by GitHub Search latency.

## 🔧 Useful Tilt Debugging Commands

### Essential Tilt Commands for Troubleshooting:
```bash
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

### When to Use These Commands:
- **`tilt get uiresources`**: When services aren't starting or you need to see what Tilt is managing
- **`tilt logs <resource>`**: When a service fails to start or behaves unexpectedly
- **`tilt enable/disable`**: When services get auto-disabled (common with Docker Compose)
- **`tilt trigger`**: When you need to force restart a specific service

## 🔧 Useful Tilt Commands for Debugging

### Essential Tilt Debugging Commands
```bash
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

### When to Use These Commands
- **`tilt get uiresources`**: When services aren't starting or you need to see what resources exist
- **`tilt logs <resource>`**: When a service is failing or not behaving as expected
- **`tilt enable/disable`**: When services are auto-disabled (common with docker-compose)
- **`tilt trigger`**: When you need to force restart a specific service

## 🔍 PostGraphile Access Guide

### What is PostGraphile?
PostGraphile automatically generates a GraphQL API from your PostgreSQL schema. It provides:
- **GraphiQL Playground**: Interactive GraphQL explorer
- **Auto-generated Schema**: Based on your database tables
- **Real-time Subscriptions**: WebSocket support for live data

### Accessing PostGraphile
- **URL**: http://localhost:5000
- **GraphiQL**: http://localhost:5000/graphiql (interactive playground)
- **GraphQL Endpoint**: http://localhost:5000/graphql

### Example Queries
Once your database has data, you can explore with queries like:

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

### Troubleshooting PostGraphile
- **Not showing in Tilt UI**: Restart Tilt to pick up docker-compose changes
- **Connection errors**: Ensure PostgreSQL is healthy first
- **Empty schema**: Run database migrations to create tables

### **Commands:**

```bash
# Start everything needed for GitHub Dashboard
tilt up github-dashboard

# Start legacy projects
tilt up legacy

# Start everything
tilt up
```

## 📚 **Learning Journey Steps**

### **Phase 1: Project Setup** ✅
- [x] Reorganize existing projects into test-app folder
- [x] Add @nx/nest dependency
- [x] Plan project structure
- [x] Create NestJS API project
- [x] Create React web project

### **Phase 2: Database Setup**
- [ ] Install PostgreSQL and Drizzle ORM
- [ ] Create database schema
- [ ] Set up migrations
- [ ] Create seed data

### **Phase 3: Backend Development**
- [ ] Set up NestJS modules and controllers
- [ ] Implement GitHub API proxy service
- [ ] Create CRUD operations for dashboards
- [ ] Add data validation and error handling

### **Phase 4: Frontend Development**
- [ ] Set up Material-UI theme
- [ ] Implement Redux Toolkit store
- [ ] Create dashboard builder components
- [ ] Add data visualization charts

### **Phase 5: Integration & Deployment**
- [ ] Set up Tilt configuration
- [ ] Create Docker containers
- [ ] Test full-stack integration
- [ ] Document deployment process

## 🎓 **Key Learning Concepts**

### **Nx Monorepo Benefits:**
- **Code sharing** - Share types and utilities between projects
- **Consistent tooling** - Same linting, testing, building across projects
- **Dependency management** - Automatic build order and caching
- **Atomic changes** - Modify multiple projects in one commit

### **NestJS Architecture:**
- **Modules** - Organize code into feature modules
- **Controllers** - Handle HTTP requests and responses
- **Services** - Business logic and data access
- **Dependency Injection** - Automatic dependency resolution
- **Decorators** - Declarative configuration

### **React + Material-UI:**
- **Component composition** - Build complex UIs from simple components
- **State management** - Redux Toolkit for predictable state updates
- **Theming** - Consistent design system
- **Responsive design** - Mobile-first approach

### **Database Design:**
- **Normalization** - Reduce data redundancy
- **Relationships** - Foreign keys and joins
- **Indexing** - Optimize query performance
- **Migrations** - Version control for database changes

## 🔧 **Technologies Used**

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **Nx** | Monorepo management | Build optimization, code sharing |
| **NestJS** | Backend framework | Enterprise patterns, TypeScript |
| **React** | Frontend framework | Component-based, ecosystem |
| **Material-UI** | UI components | Design system, accessibility |
| **PostgreSQL** | Database | ACID compliance, JSONB support |
| **Drizzle ORM** | Database ORM | Type safety, performance |
| **Tilt** | Development orchestration | Service management, hot reload |
| **Docker** | Containerization | Consistent environments |

## 📖 **Resources for Learning**

- [Nx Documentation](https://nx.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Material-UI Documentation](https://mui.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Tilt Documentation](https://docs.tilt.dev/)

---

*This document will be updated as we progress through the learning journey. Each step includes explanations of what we're doing and why, making it perfect for demos and knowledge sharing.*

---

## 🧠 NestJS Architecture: Controllers, Modules, Services, and Repositories

### What is a Module?
- The organizational unit in NestJS. A `Module` groups related providers (services, repositories), controllers, and imports.
- The `AppModule` is the root. Feature modules (e.g., `DashboardsModule`) encapsulate a vertical slice (routes + logic + data access).

### What is a Controller?
- The HTTP boundary. A `Controller` maps routes to methods (e.g., `GET /dashboards/:slug`).
- It should remain thin: parse/validate input, call a service, shape the HTTP response.

### What is a Service?
- The business logic layer. A `Service` implements use-cases (create dashboard, list public dashboards, etc.).
- It orchestrates repositories and other services. No HTTP details here.

### What is a Repository (in database/)?
- The data access layer. A `Repository` encapsulates queries against tables/entities (using Drizzle ORM here).
- Benefits: single responsibility, testability (easy to mock), and a clean separation from business logic.

### How they fit together (flow)
```
Client → Controller (HTTP) → Service (business logic) → Repository (data) → Database
```

### Naming Guidance (Domain-Driven, clear, consistent)
- Prefer names that reflect the domain and responsibility:
  - Module: `DashboardsModule`
  - Controller: `DashboardsController` (handles /dashboards routes)
  - Service: `DashboardsService` (operations on dashboards)
  - Repository: `DashboardRepository` (queries for the `dashboards` table)
- Prefixing with `Dashboard` is appropriate for tables/entities and their repositories because it communicates scope and intent. For shared infra (e.g., `DatabaseModule`, `ConfigModule`) do not prefix.
- If a module grows, split by feature: `DashboardsModule`, `DashboardUsersModule`, etc.

### Example structure for the Dashboards slice
```
src/
  app/
    app.module.ts                 # imports DashboardsModule, DatabaseModule
  dashboards/
    dashboards.module.ts          # wires controller + service + repos
    dashboards.controller.ts      # HTTP routes for dashboards
    dashboards.service.ts         # business logic for dashboards
  database/
    entities/                     # drizzle table definitions (one per file)
    repositories/
      dashboard.repository.ts     # data access for dashboards
    schema.ts                     # barrel re-export of entities
```

### Why this separation
- **Separation of concerns**: each layer has one reason to change.
- **Testability**: you can unit test services by mocking repositories; controllers by mocking services.
- **Maintainability**: features live together, infrastructure is centralized.

## 📦 DTOs (Data Transfer Objects)

### What is a DTO?
- A small TypeScript class that defines the shape of data crossing a boundary (typically HTTP). It is your explicit API contract.

### Why use DTOs?
- **Explicit contract**: Clients know what to send/expect.
- **Validation**: With `class-validator` decorators you enforce required/optional, types, and lengths at the edge.
- **Decoupling**: Internal entities/tables can evolve without breaking the public API.
- **Type‑safety & DX**: Strong types in controllers/services.

### How DTOs are used in NestJS
- Define classes in a `dto/` folder (e.g., `CreateDashboardDto`, `UpdateDashboardDto`).
- Add `class-validator` decorators to express constraints.
- Controllers annotate handler params with DTO types; a global ValidationPipe validates/transforms incoming JSON before handlers run.

### Examples (from this project)
```ts
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
```

```ts
// update-dashboard.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateDashboardDto } from './create-dashboard.dto';

export class UpdateDashboardDto extends PartialType(CreateDashboardDto) {}
```

```ts
// dashboards.controller.ts (usage)
@Post()
async create(@Body() dto: CreateDashboardDto) {
  return this.dashboardsService.create(dto);
}

@Put(':id')
async update(@Param('id') id: string, @Body() dto: UpdateDashboardDto) {
  return this.dashboardsService.update(id, dto);
}
```

### Best practices
- Keep DTOs API‑focused and thin.
- Don’t expose internal fields you don’t want public.
- Use `PartialType`, `PickType`, `OmitType` to compose DTOs without duplication.

