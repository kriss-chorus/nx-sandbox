# @nx-sandbox/common

Shared utilities and types used by other projects in the workspace.

## Exports

- `common()` — returns a simple string, useful for sanity checks.
- `formatTimestamp(date?: Date)` — ISO timestamp formatter.
- `createResponse<T>(data: T, status: 'success' | 'error' = 'success')` — standard response envelope.

## Usage

```ts
import { createResponse } from '@nx-sandbox/common';

const payload = createResponse({ hello: 'world' });
```
