# GitHub Dashboard (Nx Workspace)

## Overview
A dashboard builder to track GitHub activity across users and repositories. This project lives inside the nx-sandbox monorepo and consists of:

- api: NestJS backend (GitHub integration, Drizzle ORM, REST)
- web: React + MUI frontend (dashboard creation, activity views)
- infra (local): Tilt + docker-compose for Postgres and PostGraphile (optional)

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

## Conventions
- Type-safe Drizzle entities and repositories
- DTO validation on API inputs
- Normalized schema: dashboards ↔ github_users via junction; per-dashboard repositories; per-type activity configs
