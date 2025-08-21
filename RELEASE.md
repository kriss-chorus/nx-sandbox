# NX Release Configuration

This workspace is configured with NX release for independent versioning and publishing of packages.

## Configuration

The release configuration is set up in `nx.json` with the following features:

- **Independent versioning**: Each project can be versioned independently
- **Conventional commits**: Uses conventional commit messages to determine version bumps
- **Pre-version builds**: Automatically builds affected projects before versioning
- **Rich changelogs**: Includes authors, commit references, and GitHub username mapping

## Usage

### Creating a Release

To create a release for all projects:

```bash
nx release
```

To create a release for specific projects:

```bash
nx release --projects=api,common
```



### Versioning

The release system uses conventional commits to determine version bumps:

- `feat:` - Minor version bump
- `fix:` - Patch version bump
- `BREAKING CHANGE:` - Major version bump

You can also specify a version manually:

```bash
nx release 1.0.0
nx release minor
nx release patch
```

### Dry Run

To preview changes without actually creating a release:

```bash
nx release --dry-run
```

### Publishing

To publish packages to npm:

```bash
nx release publish
```

Or skip publishing during release:

```bash
nx release --skip-publish
```

### Changelog

To generate a changelog:

```bash
nx release changelog
```

## Conventional Commits

Follow the conventional commit format for your commits:

```
type(scope): description

[optional body]

[optional footer(s)]
```

Examples:
- `feat(api): add user authentication endpoint`
- `fix(client): resolve navigation issue`
- `feat(common): add utility functions for date formatting`

Breaking changes:
- `feat(api)!: change user endpoint response format`

## Package Names

The packages are published under the `@nx-sandbox` scope:

- `@nx-sandbox/api`
- `@nx-sandbox/client`
- `@nx-sandbox/common`

## Pre-version Builds

Before versioning, the system automatically runs `pnpm nx affected -t build` to ensure all affected projects are built. This ensures that the latest changes are included in the release.

## Changelog Features

The changelog generation includes:
- **Authors**: Shows who made the changes
- **GitHub username mapping**: Links authors to their GitHub profiles
- **Commit references**: Links to specific commits
- **Version title dates**: Shows when each version was released

## First Release

For the first release, use the `--first-release` flag:

```bash
nx release --first-release
```

This is needed when there are no existing git tags or published versions to determine the current version.
