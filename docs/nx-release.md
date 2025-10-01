## POC overview

- **Projects**: `common` (lib), `api` (depends on `common`), `client` (independent)
- **Goal**: Validate Nx Release with independent versioning and selective releases

## Commands used

- All affected: `nx release`
- Targeted: `nx release --projects=client`
- Dry run: `nx release --dry-run`
- First run: `nx release --first-release`

## Config highlights

- Shorter tags: set `nx.name` per project to `api`, `client`, `common` (tags like `api@x.y.z`)
- Release scope: `release.projects` = `["client","api","common"]`
 
### Conventional commits customization (Nx)

- We can customize types in `nx.json` under `release.conventionalCommits.types`.
- Examples:
  - Make refactors bump patch and show in changelog:
    - `"refactor": { "semverBump": "patch" }`
  - Keep docs out of versioning but show a custom section:
    - `"docs": { "semverBump": "none", "changelog": { "title": "Documentation changes" } }`
  - Hide chores entirely:
    - `"chore": { "semverBump": "none", "changelog": false }`
  - Unspecified types keep defaults (feat→minor, fix→patch, !/BREAKING CHANGE→major).
  - Docs: https://nx.dev/recipes/nx-release/customize-conventional-commit-types

## Key findings

- Changing `common`:
  - `common` bumps (fix→patch; feat→minor)
  - `api` also bumps (at least patch) and its dependency range updates
- Selective releases: `nx release --projects=common,api` lets us skip `client` when it’s not ready
 - Conventional commit defaults in Nx:
  - `feat`: minor; `fix`: patch; `!` or `BREAKING CHANGE` footer: major
  - Other types (e.g., `refactor`, `docs`, `chore`, `style`, `build`, `ci`, `test`): no bump by default
  - Scope is optional; affected projects are inferred from changed file paths
  - “Updated Dependencies” appears when a dependent package bumps due to an internal dependency change
  - Non‑conforming commit messages are ignored by default (can opt in via `__INVALID__` if desired)
  - Additional types/behavior can be customized via `release.conventionalCommits.types`

## Not included in this POC

- Registry/publishing (packages remain private)
- CI/CD

## Questions for discussion

- Do we want to release all or per‑project only?
- Which conventional‑commit customizations should we adopt (e.g., refactor → patch, docs section title, hide chores)?
- What image tagging standard do we want (package versions?), and how do we promote across dev/staging/prod?
- Deployment strategy preference: single‑app vs deploy‑all, and how to handle dependencies?

### Commands cheat sheet

- Preview all: `nx release --dry-run`
- Target project(s): `nx release --projects=api,common --dry-run`
- First release: `nx release --first-release`
