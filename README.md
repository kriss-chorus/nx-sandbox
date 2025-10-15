# Nx Sandbox Monorepo

This workspace hosts multiple experiments and applications built with Nx, pnpm, and modern web technologies.

## Projects

### Core Packages

- **packages/common**: Shared utilities and types
- **packages/test-app**: Legacy reference applications (Express API + React client)

### Applications

- **packages/github-dashboard**: Multi-tenant dashboard with tier-based client experiences
  - API: NestJS backend with PostGraphile and GitHub integration
  - Web: React frontend with MUI and dynamic theming

## Quick Start

```bash
# Install dependencies
pnpm install

# Start GitHub Dashboard (recommended)
pnpm run tilt:up:github-dashboard

# Stop services
pnpm run tilt:down
```

## Documentation

- **[GitHub Dashboard](packages/github-dashboard/README.md)** - Multi-tenant dashboard application
- **[Architecture Docs](docs/)** - Technical documentation and learnings
- **[Nx Release Setup](docs/nx-release-setup.md)** - Release automation configuration

## Tech Stack

- **Monorepo**: Nx workspace with pnpm
- **Frontend**: React, TypeScript, MUI, Vite
- **Backend**: NestJS, PostGraphile, PostgreSQL, Drizzle ORM
- **DevOps**: Docker, Tilt, Kubernetes
- **Testing**: Jest, Playwright, E2E testing

## Development

### Ports

- **API**: 3001 (NestJS)
- **Web**: 4202 (Vite)
- **Database**: 5432 (PostgreSQL)
- **GraphQL**: 5000 (PostGraphile)
- **Tilt UI**: 10360

### Commands

```bash
# Run specific projects
pnpm nx serve github-dashboard-api
pnpm nx serve github-dashboard-web

# Run tests
pnpm nx test github-dashboard-api
pnpm nx e2e github-dashboard-web-e2e

# Build projects
pnpm nx build github-dashboard-api
pnpm nx build github-dashboard-web
```

## TODO

- [ ] Add more application examples
- [ ] Improve CI/CD pipeline
- [ ] Add comprehensive testing strategy
