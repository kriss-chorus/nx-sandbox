# Nx Sandbox Monorepo

This workspace hosts multiple experiments and apps. The primary project is the GitHub Dashboard.

## Projects
- packages/common: shared utilities
- packages/github-dashboard
  - api: NestJS backend (REST, Drizzle ORM, GitHub integration)
  - web: React + MUI frontend

## Getting Started
- Install deps: pnpm install
- Dev via Tilt (recommended):
  - pnpm run tilt:up:github-dashboard
  - pnpm run tilt:down

## Docs
- GitHub Dashboard: [packages/github-dashboard/README.md](packages/github-dashboard/README.md)
- Learnings — GitHub Dashboard: [docs/github-dashboard.md](docs/github-dashboard.md)
- Learnings — Nx Release: [docs/nx-release.md](docs/nx-release.md)

## Tooling
- Nx for task orchestration and graph
- Docker/Tilt for local infra (Postgres, PostGraphile)
- Drizzle ORM for schema + migrations

## Notes
- Keep commits scoped to changed projects
- Prefer normalized database design
- Use server-side caching and rate-limit aware GitHub access
