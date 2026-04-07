

## Fix Build Errors

The build is completely broken due to dependency resolution failures. Here's the plan:

### Root Cause
- `bun install` fails resolving `@tanstack/query-core@5.96.2` — a transitive dependency of `@tanstack/react-query`
- This prevents all node_modules from installing, causing every TypeScript error (missing modules, missing types)
- `vite: command not found` is a cascading failure from the failed install

### Fix
1. **Pin `@tanstack/react-query` to a known-compatible version** (e.g., `5.56.2`) in `package.json` to avoid the problematic `query-core` resolution
2. **Pin `vite` to `^5.4.0`** instead of `^7.3.0` (Vite 7 may not be stable/available yet — the project was likely on Vite 5)
3. **Remove `bun.lock`** to force a clean dependency resolution

These are the only changes needed — all the TypeScript errors (`Cannot find module 'react'`, etc.) will resolve once `bun install` succeeds.

### After Fix
Once the build is green, I'll navigate to the Collision Engine page and test the theory collision flow end-to-end.

