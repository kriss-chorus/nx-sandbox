# GitHub Dashboard (Nx Workspace)

## Overview

A dashboard builder to track GitHub activity across users and repositories. This project lives inside the nx-sandbox monorepo and consists of:

- api: NestJS backend (GitHub integration, Drizzle ORM, REST)
- web: React + MUI frontend (dashboard creation, activity views)
- infra (local): Tilt + docker-compose for Postgres and PostGraphile (optional)

## Premium Features

The dashboard implements a tier-based system providing different experiences for Basic and Premium clients:

- **Basic Tier (Candy Corn Labs)**: Light theme with core dashboard functionality
- **Premium Tier (Haunted Hollow)**: Dracula-inspired dark theme with three exclusive features:
  - Dashboard Type Chips (layout switching)
  - Summary Bar (aggregated team statistics)
  - Export Button (CSV download with entitlement enforcement)

📖 **See [Premium Features Documentation](../../docs/03-premium-features.md) for detailed technical implementation.**

## Directory

```
packages/github-dashboard/
  ├─ api/   # NestJS
  └─ web/   # React (Vite)
```

## Run (local, recommended)

- Start DB + PostGraphile + dev stack with Tilt (custom port in scripts):
  - pnpm run tilt:up:github-dashboard
  - pnpm run tilt:down (to stop)
- Or run individually:
  - Postgres/PostGraphile via docker-compose in github-dashboard/
  - API: pnpm run start:dev from packages/github-dashboard/api
  - Web: pnpm run dev from packages/github-dashboard/web

## Environment

Create a .env at the repo root for the API with an optional GitHub PAT:

```
GITHUB_TOKEN=ghp_xxx   # scopes: repo, read:user, read:org (org/private repos)
```

## API (selected)

Base: http://localhost:3001/api

- Dashboards

  - POST /dashboards/:id/users (body: { githubUsername })
  - DELETE /dashboards/:id/users/:username
  - GET /dashboards/:id/users
  - GET /dashboards/:id/repositories
  - POST /dashboards/:id/repositories (body: { name: "owner/repo" })
  - DELETE /dashboards/:id/repositories/:name
  - GET /dashboards/:id/activity-config
  - PUT /dashboards/:id/activity-config

- GitHub
  - GET /github/users/cached-batch-activity-summary?dashboard_id=...&include_reviews=true|false
    - Optional: repos (string|string[]), users (string|string[]), no_cache=1

## Performance & UX

- Repo-first aggregation (created/merged) when reviews off → 2 searches per repo, cached
- include_reviews to enable expensive review/reaction path
- SWR cache (server) + sessionStorage hydration (client) + two-stage fetch (fast then full)

## Challenges & Notes

See [docs/github-dashboard.md](../../docs/github-dashboard.md) for:

- PostGraphile + Tilt visibility (resource/health)
- Batch performance approaches
- Rate-limiting and caching strategies
- UI/UX decisions (single-page nav, removal of visibility chip, etc.)

## Testing

### E2E Tests

This project includes comprehensive end-to-end tests for both the API and Web applications.

#### API E2E Tests

Tests the backend API endpoints for dashboard management, user operations, and GitHub integration.

```bash
# Run API e2e tests (builds API, serves it, then runs tests)
# Recommended locally: preload test-only GitHub mocks into the API process
NODE_OPTIONS="--require $(pwd)/packages/github-dashboard/api-e2e/src/support/register-nock.js" pnpm nx run api-e2e:e2e

# Run API e2e tests in watch mode
NODE_OPTIONS="--require $(pwd)/packages/github-dashboard/api-e2e/src/support/register-nock.js" pnpm nx run api-e2e:e2e:watch

# Run API e2e tests in CI mode (with coverage)
NODE_OPTIONS="--require $PWD/packages/github-dashboard/api-e2e/src/support/register-nock.js" pnpm nx run api-e2e:e2e:ci

# Run a single API e2e test by name
NODE_OPTIONS="--require $(pwd)/packages/github-dashboard/api-e2e/src/support/register-nock.js" pnpm nx run api-e2e:e2e --testNamePattern="should fetch user PR stats"
```

**Test Coverage:**

- Dashboard CRUD operations (create, read, update, delete)
- User management (add/remove users from dashboards)
- Repository management (add/remove repositories from dashboards)
- Activity configuration (enable/disable activity types)
- GitHub API integration (user/repo creation, activity tracking)

#### Web E2E Tests

Tests the frontend user flows using Playwright for browser automation.

```bash
# Run Web e2e tests (builds web, serves it, then runs Playwright tests)
pnpm nx run web-e2e:e2e

# Run Web e2e tests in watch mode
pnpm nx run web-e2e:e2e:watch

# Run Web e2e tests in CI mode
pnpm nx run web-e2e:e2e:ci
```

**Test Coverage:**

- Client selection and creation
- Dashboard creation and configuration
- User interface navigation and interactions
- Form validation and error handling
- Responsive design (mobile, tablet, desktop)
- Full stack integration workflows

#### Integration Tests

Tests the complete application flow from frontend to backend.

```bash
# Run only integration tests
pnpm nx run web-e2e:e2e --grep "Full Stack Integration Tests"
```

**Test Coverage:**

- End-to-end dashboard creation via UI with API verification
- Configuration changes through UI with backend persistence
- Data consistency between frontend and backend
- Error handling across the full stack

#### Running All Tests

```bash
# Run both API and Web e2e tests in parallel
pnpm nx run-many --target=e2e --projects=api-e2e,web-e2e

# Run all e2e tests with CI configuration
pnpm nx run-many --target=e2e:ci --projects=api-e2e,web-e2e

# Run specific test suites
pnpm nx run web-e2e:e2e --grep "Dashboard E2E Tests"
NODE_OPTIONS="--require $(pwd)/packages/github-dashboard/api-e2e/src/support/register-nock.js" pnpm nx run api-e2e:e2e --testNamePattern="Dashboard API E2E Tests"
```

#### Test Data Management

Tests use automated data seeding and cleanup:

- **Global Setup**: Creates test clients, users, repositories, and dashboards
- **Test Isolation**: Each test gets fresh data to avoid conflicts
- **Cleanup**: Automatic cleanup after test completion
- **Database State**: Tests run against a clean database state

#### Prerequisites

Before running e2e tests, ensure:

1. **Database is running**: Postgres should be available (via Tilt or docker-compose)
2. **API server**: Will be automatically started by Nx if not running
3. **Web server**: Will be automatically started by Nx if not running
4. **Environment**: `.env` file with `GITHUB_TOKEN` (optional, tests will mock GitHub API calls)

Notes:

- Install dependencies from the workspace root:
  - `pnpm install`
- Project-specific test deps (e.g., `nock`, `axios`) are declared in `packages/github-dashboard/api-e2e/package.json`.
- The API e2e suite mocks outbound GitHub calls by preloading `register-nock.js` into the API process via `NODE_OPTIONS` (no app code changes).

#### Test Structure

```
packages/github-dashboard/
├── api-e2e/
│   ├── src/api/
│   │   ├── dashboard.spec.ts    # Dashboard CRUD and management
│   │   └── github.spec.ts       # GitHub API integration
│   └── src/support/
│       ├── test-data.ts         # Test data management
│       ├── global-setup.ts      # Test environment setup
│       └── global-teardown.ts   # Test cleanup
└── web-e2e/
    ├── src/
    │   ├── dashboard.spec.ts    # Web UI dashboard flows
    │   ├── integration.spec.ts  # Full stack integration
    │   └── example.spec.ts      # Basic smoke tests
    └── src/support/
        └── test-data.ts         # Web test data management
```

## Conventions

- Type-safe Drizzle entities and repositories
- DTO validation on API inputs
- Normalized schema: dashboards ↔ github_users via junction; per-dashboard repositories; per-type activity configs
- Comprehensive e2e test coverage for all user workflows
- Automated test data management with proper cleanup
- **Modular theme system**: SOLID-compliant theme factory with separate basic/premium themes
- **Tier-based feature delivery**: Premium features conditionally rendered based on client tier
- **Client ownership enforcement**: Cross-client dashboard access blocked with appropriate error states
