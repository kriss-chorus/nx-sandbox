# GitHub Dashboard

A multi-tenant dashboard builder that tracks GitHub activity across users and repositories with tier-based client experiences.

## Features

### Client Tier System

**Basic Tier Dashboard**
![Basic Tier Dashboard](docs/images/basic-dashboard.png)
_Coral orange theme with core dashboard functionality_

> 📸 **Screenshot needed**: Take a full-page screenshot of the Basic tier dashboard showing the coral orange theme with core functionality.

**Premium Tier Dashboard**
![Premium Tier Dashboard](docs/images/premium-dashboard.png)
_Dracula dark theme with exclusive features_

> 📸 **Screenshot needed**: Take a full-page screenshot of the Premium tier dashboard showing the Dracula dark theme with premium features.

### Premium Features

**🎨 Dynamic Theme Switching**
![Theme Switching Demo](docs/videos/theme-switching.mp4)
_Seamless theme transitions between Basic and Premium tiers_

> 🎥 **Video needed**: Record a 10-15 second video showing theme switching between Basic (coral orange) and Premium (Dracula dark) tiers.

**📊 Dynamic Layout Switching**
![Layout Switching Demo](docs/videos/layout-switching.mp4)
_Three dashboard layouts: User Activity, Team Overview, Project Focus_

> 🎥 **Video needed**: Record a 10-15 second video showing dashboard type chip clicking and layout switching between User Activity, Team Overview, and Project Focus layouts.

**📈 Summary Bar & Export**

- Aggregated team statistics
- CSV download functionality

### Core Functionality

- Multi-tenant client management
- Dashboard creation and configuration
- GitHub user and repository tracking
- Activity monitoring (PRs created, reviewed, merged)
- Responsive design for all devices

## Quick Start

From the nx-sandbox repo root:

```bash
# Start the entire stack
pnpm run tilt:up:github-dashboard

# Or run individual services
pnpm nx serve github-dashboard-api
pnpm nx serve github-dashboard-web
```

### Environment

Create `.env` at repo root:

```
GITHUB_TOKEN=ghp_xxx   # Optional: for GitHub API access
```

### Demo Flow

1. **Select Client**: Choose between Basic (Candy Corn Labs) or Premium (Haunted Hollow)
2. **Create Dashboard**: Add users, repositories, and configure activity tracking
3. **View Activity**: Monitor PR activity with different layouts (Premium only)
4. **Export Data**: Download CSV reports (Premium only)

## Architecture

### Tech Stack

- **Frontend**: React + TypeScript + MUI + Vite
- **Backend**: NestJS + PostGraphile + PostgreSQL
- **Database**: PostgreSQL with Drizzle ORM
- **GraphQL**: PostGraphile auto-generated API
- **Theming**: Dynamic theme system with tier-based styling

### Key Components

- **ClientContext**: Global state management for client selection and premium features
- **DashboardLayouts**: Dynamic layout switching based on dashboard type
- **ThemeFactory**: Modular theme system (neutral, basic, premium)
- **ActivityConfigs**: Configurable activity tracking (PRs created, reviewed, merged)

## Testing

### E2E Tests

```bash
# Run API e2e tests
NODE_OPTIONS="--require $(pwd)/packages/github-dashboard/api-e2e/src/support/register-nock.js" pnpm nx run api-e2e:e2e

# Run Web e2e tests
pnpm nx run web-e2e:e2e

# Run all tests
pnpm nx run-many --target=e2e --projects=api-e2e,web-e2e
```

### Test Coverage

- Dashboard CRUD operations
- Client tier system and premium features
- User and repository management
- Activity tracking and configuration
- Responsive design and UI interactions
- Full stack integration workflows

## Documentation

- **[Client Experiences Guide](../../docs/02-demo-client-experiences.md)** - Complete implementation details
- **[Database Schema](../../docs/architecture-database-schema.md)** - Data model and relationships
