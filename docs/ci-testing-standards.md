# CI & Testing Standards

Standards derived from real CI failures. Apply to all monorepo projects.

## 1. Vitest Aliases Must Match Package Names

Aliases in `vitest.config.ts` must match the `"name"` field in each package's `package.json`, **not** the directory name.

```ts
// BAD - uses directory name
'@grayce-workflow/workflow-engine': resolve(__dirname, './packages/workflow-engine/src')

// GOOD - uses package.json "name" field
'@grayce-workflow/engine': resolve(__dirname, './packages/workflow-engine/src')
```

**Auto-generate aliases** to prevent drift:

```ts
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

const packageAliases = Object.fromEntries(
  readdirSync('./packages').map(pkg => {
    const { name } = JSON.parse(readFileSync(`./packages/${pkg}/package.json`, 'utf8'));
    return [name, resolve(__dirname, `./packages/${pkg}/src`)];
  })
);
```

**Audit script** (add to CI or pre-commit):

```bash
for dir in packages/*/; do
  name=$(jq -r .name "$dir/package.json")
  grep -q "\"$name\"" vitest.config.ts || echo "MISSING alias: $name ($dir)"
done
```

## 2. Tests Must Never Depend on dist/

Package `exports` fields point to `./dist/index.js`. Without correct vitest aliases, vite resolves via exports — which requires a prior build. CI runs tests without building packages first.

**Rule:** All vitest aliases point to `src/`, never `dist/`.

**Verify:** Delete all `dist/` directories and run tests:

```bash
find packages -name dist -type d -exec rm -rf {} + 2>/dev/null
pnpm test
```

If tests fail, aliases are misconfigured.

## 3. Mock External Modules Completely

When mocking a module like `pg`, mock **every property** the consumer touches — not just the obvious methods.

```ts
// BAD - missing on(), totalCount, idleCount, waitingCount
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: vi.fn().mockResolvedValue({ rows: [] }),
  }))
}));

// GOOD - complete mock
vi.mock('pg', () => {
  const MockPool = vi.fn().mockImplementation(() => ({
    query: vi.fn().mockResolvedValue({ rows: [{ now: new Date() }] }),
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    }),
    end: vi.fn(),
    on: vi.fn(),           // EventEmitter methods
    totalCount: 1,         // Pool stats
    idleCount: 1,
    waitingCount: 0,
  }));
  return { default: { Pool: MockPool }, Pool: MockPool };
});
```

**Checklist for mocks:**
- [ ] Constructor properties and methods
- [ ] EventEmitter methods (`on`, `once`, `emit`)
- [ ] Getter/property accessors
- [ ] Async methods return resolved promises (not undefined)

## 4. No Env-Dependent Calls at Module Scope

Functions that read environment variables must not run at import time. They crash tests before any setup runs.

```ts
// BAD - crashes at import if JWT_SECRET is missing
const jwtService = createJWTService();
export function requireAuth(req, res, next) { ... }

// GOOD - lazy initialization
let _jwtService: JWTService;
function getJWTService() {
  return _jwtService ??= createJWTService();
}
export function requireAuth(req, res, next) {
  const jwtService = getJWTService();
  ...
}
```

**If you must keep module-scope init**, tests need one of:
- `vi.hoisted(() => { process.env.JWT_SECRET = 'test-value'; })` — runs before mocks
- `vi.mock('./module.js', () => ({ ... }))` — replaces the module entirely

## 5. Separate Test Tiers

Performance tests use `sleep()` and timing assertions that fail on slower CI runners. Keep them out of the default test command.

```json
{
  "test": "vitest run --exclude 'tests/performance/**'",
  "test:performance": "vitest run tests/performance",
  "test:ci": "vitest run --exclude 'tests/performance/**' --coverage --reporter=verbose"
}
```

**Test tier structure:**

| Tier | Command | Runs in CI | Timeout |
|------|---------|-----------|---------|
| Unit + Integration | `pnpm test` | Every push | 30s/test |
| Performance | `pnpm test:performance` | Scheduled/manual | 60s/test |
| E2E | `pnpm test:e2e` | Staging deploy | 120s/test |

## 6. CI Must Work From Clean State

Tests that pass locally but fail in CI usually depend on local artifacts (`dist/`, `.env`, cached data).

**Periodic local verification:**

```bash
git stash --include-untracked
rm -rf node_modules **/dist
pnpm install --frozen-lockfile
pnpm test
git stash pop
```

**CI workflow must not:**
- Depend on cached build artifacts for test resolution
- Require env vars that aren't set in the workflow
- Assume any file exists beyond what's in the repo

## Quick Reference Checklist

Use before merging any CI/test changes:

- [ ] Every workspace package has a matching vitest alias (name, not dir)
- [ ] `rm -rf **/dist && pnpm test` passes
- [ ] External module mocks cover constructors, events, and properties
- [ ] No `createXxxService()` calls at module scope
- [ ] Performance/timing tests excluded from default `pnpm test`
- [ ] All required env vars are set in CI workflow yaml
- [ ] `pnpm install --frozen-lockfile && pnpm test` works from clean clone
