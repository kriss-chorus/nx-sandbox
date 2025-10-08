# GitHub Dashboard: API Cleanup (PostGraphile + Frontend)

## Overview
This document reflects the current, kept architecture after cleanup:
- Backend stays on PostGraphile for CRUD (auto-generated GraphQL at `/graphql`).
- Frontend uses a lightweight PostGraphile client and custom hooks.
- Components are decomposed (SRP) and configuration moved into a modal.
- User activity stats are computed via backend GitHub proxy endpoints using explicit repositories and date ranges.

All Apollo/NestJS GraphQL server work was removed. This file only documents what remains.

## Final Architecture
- PostGraphile provides CRUD for dashboards, users, repositories, and activity configs.
- Frontend queries/mutations are in `postgraphile-client.ts` and consumed by hooks in `useDashboardDataPostGraphile.ts`.
- React components are organized under:
  - `components/dashboard` (list view, dashboard view, modals)
  - `components/user` (user cards, activity grid)
  - `components/activity` (date range/sort controls)
- Dashboard configuration (repos, users, visibility, date range) is done via a modal and persisted to the DB.
- An `ErrorBoundary` wraps routes for stability.

### Nx migration commands (fix)
- Added Nx targets on API to drive Drizzle:
  - `github-dashboard-api:migrate:generate` → runs `drizzle-kit generate`
  - `github-dashboard-api:migrate:up` → runs `drizzle-kit migrate`
- Executor fix: use `nx:run-commands` (not `@nx/workspace:run-commands` or `@nx/run-commands`).
- Location: `packages/github-dashboard/api/package.json` under `nx.targets`.

## Key Frontend Files (kept)
- `packages/github-dashboard/web/src/app/api/postgraphile-client.ts`
  - `DASHBOARD_QUERIES`, `DASHBOARD_USER_*`, `DASHBOARD_REPOSITORY_*`, `ACTIVITY_CONFIG_QUERIES`
  - `executeGraphQL`
- `packages/github-dashboard/web/src/app/hooks/useDashboardDataPostGraphile.ts`
  - Data: load dashboard by slug, dashboards list, users, repos, activity configs
  - CRUD: create/update dashboard, add/remove users/repos, create/get GitHub users, save activity config
  - Request de-dup to prevent duplicate loads
- `packages/github-dashboard/web/src/app/components/dashboard/`
  - `Dashboard.tsx`, `DashboardList.tsx`, `modals/DashboardConfigModal.tsx`, `modals/CreateDashboardDialog.tsx`, `index.ts`
- `packages/github-dashboard/web/src/app/components/user/`
  - `UserCard.tsx`, `UserActivityGrid.tsx`, `index.ts`
- `packages/github-dashboard/web/src/app/components/activity/`
  - `ActivitySettings.tsx`, `index.ts`
- `packages/github-dashboard/web/src/app/app.tsx`
  - Routes (`/`, `/dashboard/:dashboardSlug`) wrapped with `ErrorBoundary`

## Important Behaviors
- Date Range Persistence
  - Saved via `saveActivityConfiguration` and reloaded on mount.
- Repository Source for Stats
  - After saving or on manual refresh, repositories are refetched from PostGraphile and explicitly passed into the stats fetch; if none, fall back to the modal selection.
- Stats Fetch (created/merged/reviewed)
  - `Dashboard.tsx` calls `/api/github/users/:username/activity-summary?repos=...&start_date=...&end_date=...` with explicit repos/dates. Calls are spaced to mitigate rate limiting.
- Duplicate Call Prevention
  - Data hook uses request de-dup to avoid double `GetDashboardBySlug`.
- Error Visibility
  - `ErrorBoundary` shows errors instead of blank screens; effects guarded to avoid infinite loops.

## PostGraphile Queries (examples that we use)
- Dashboards list: `allDashboards { nodes { id name slug isPublic dashboardGithubUsersByDashboardId { totalCount } } }`
- Dashboard by slug: `dashboardBySlug(slug: ...) { id name slug description isPublic }`
- Users by dashboard: `allDashboardGithubUsers(condition: { dashboardId: ... }) { nodes { id githubUserByGithubUserId { id githubUsername avatarUrl profileUrl } } }`
- Repositories by dashboard: `allDashboardRepositories(condition: { dashboardId: ... }) { nodes { id fullName owner name githubRepoId } }`
- Activity config by dashboard: `allDashboardActivityConfigs(condition: { dashboardId: ... }) { nodes { id dateRangeStart dateRangeEnd } }`

## Recent Fixes
- Persist and reload date range from DB.
- Refetch repos from DB before computing stats; pass repos/dates explicitly to fetch.
- Removed automatic effects that caused update loops; provide a manual refresh that is safe.
- Moved configuration-only UI to modal; kept dashboard view focused.
- Fixed PostGraphile relation names and added user counts in the dashboard list.
- Removed unused REST calls (org members) and legacy components.

## Nx / Workspace Notes
- Use `pnpm` at repo root; dependencies are managed at the root level.
- `tsconfig.*` extends root `tsconfig.base.json` with correct relative paths.
- Serve with Nx: `nx serve github-dashboard-api`, `nx serve github-dashboard-web`.
