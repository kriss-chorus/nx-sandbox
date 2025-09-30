# NX Commands & Project Setup

## Project Structure

This is an **NX/pnpm monorepo** - never use npm. The project uses NX for task orchestration and pnpm for package management.

## Essential Commands

### Running Tasks

Always check the `project.json` file in each project directory for available commands first.

```bash
# Run any NX task
nx run <project-name>:<task-name>

# Examples
nx run @platform/signature-component-library:build
nx run @platform/common-store:test
```

### Running Tests

Tests use **Vitest**, not Jest. Import test utilities from 'vitest':

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
```

```bash
# Run tests for a specific file
nx run <project-name>:vite:test -- path/to/file.spec.ts

# Example
nx run @platform/signature-component-library:vite:test -- src/components/TextField.spec.tsx
```

### Project Naming Convention

NX projects use the format `@scope/project-name`. Examples:

- `@platform/signature-component-library`
- `@platform/common-store`
- `@platform/nestjs-db`

## Common NX Commands

```bash
# Build a project
nx build <project-name>

# Serve/run a project
nx serve <project-name>

# Run tests
nx test <project-name>

# Run linting
nx lint <project-name>

# See project dependencies
nx graph

# Run affected tasks (based on git changes)
nx affected -t test
nx affected -t build
nx affected -t lint
```

## Project.json Structure

Always check the `project.json` file in each project for available commands:

```json
{
  "name": "@platform/signature-component-library",
  "targets": {
    "build": {
      "executor": "@nx/vite:build"
    },
    "vite:test": {
      "executor": "@nx/vite:test"
    },
    "storybook": {
      "executor": "@nx/storybook:storybook"
    }
  }
}
```

## Package Management

### Adding Dependencies

```bash
# Add to workspace root
pnpm add -w <package-name>

# Never Add to specific project

# Add dev dependency
pnpm add -w -D <package-name>
```

### Workspace Packages

For adding workspace packages to projects, see: [Adding Workspace Packages Guide](../../docs/adding-workspace-packages.md)

## Development Workflow

1. **Always use pnpm** - npm is not configured for this monorepo
2. **Check project.json first** - Each project may have custom commands
3. **Use NX commands** - Don't run scripts directly
4. **Import from workspace packages** - Use `@platform/*` imports

## Tilt Integration

The project uses Tilt for local development orchestration. Test databases and services are automatically managed by Tilt.

## CI/CD Integration

- Tests run automatically in CI
- Test database is provisioned automatically
- All NX affected commands are used in CI pipelines
