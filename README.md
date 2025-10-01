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

## Project Structure
```
nx-sandbox/
├── packages/
│   ├── common/                    # Shared utilities
│   ├── test-app/                  # Legacy/reference projects
│   │   ├── api/                   # Express API (reference)
│   │   └── client/                # React client (reference)
│   │
│   └── github-dashboard/          # GitHub Dashboard
│       ├── api/                   # NestJS backend (Drizzle ORM, GitHub integration)
│       └── web/                   # React frontend (MUI, Vite)
│
├── github-dashboard/
│   ├── Tiltfile                   # Dev orchestration
│   ├── docker-compose.yml         # Local DB and tooling
│   └── .env.example               # Environment variables
│
└── Tiltfile                       # Root orchestrator
```

For detailed architecture and learnings, see [docs/github-dashboard.md](docs/github-dashboard.md).

## Development
- Install deps: `pnpm install`
- Start (Tilt): `pnpm run tilt:up:github-dashboard`
- Stop (Tilt): `pnpm run tilt:down`

Ports
- API (NestJS): 3001
- Web (Vite): 4202
- PostgreSQL: 5432
- PostGraphile (optional): 5000
- Tilt UI: 10360

Troubleshooting and deeper workflow details: see [docs/github-dashboard.md](docs/github-dashboard.md).
