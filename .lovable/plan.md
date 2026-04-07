

## Connect Big Brain to Live zhihuiti Backend

This plan replaces mock/empty data across 5 pages with live API calls to `https://zhihuiti-oracle.zeabur.app`.

### What changes

**1. Dashboard (`src/pages/dashboard.tsx`)** — Major rewrite
- Replace the existing crypto-focused dashboard with live system data
- Add queries: `GET /api/status` (10s), `GET /api/agents` (10s), `GET /api/evolution` (30s)
- Stat cards: Total Agents (status.agent_count), Active Agents (agents where alive=true), Total Trades (economy.transactions), Products (memory.total_tasks)
- "Recent Agent Activity" section: last 5 goals from evolution.recent_goals with goal text + status badge
- Remove the crypto price ticker (replaced by system metrics)

**2. Agents page (`src/pages/agents.tsx`)** — Minor updates
- Already well-connected. Update `fetchAgents` source to use zhihuiti API instead of agentscity
- Goal submission and polling already implemented — no changes needed there

**3. `src/lib/agents-api.ts`** — Switch API URL
- Change from `agentscity.zeabur.app/api/all-agents` to `zhihuiti-oracle.zeabur.app/api/agents`
- Update field mapping to match zhihuiti response shape

**4. Collision Engine (`src/pages/collision-engine.tsx`)** — Fix API key issue
- Currently uses OpenRouter with a user-provided API key — switch to the Supabase edge function `collide-theories` that was already set up (it uses Lovable AI)
- Remove the API key dialog and localStorage persistence

**5. Collisions page (`src/pages/collisions.tsx`)** — Add live data overlay
- Keep existing local theory collision data
- Add `GET /api/oracle/theories/stats` query for live theory graph stats (show as summary cards)
- Add `GET /api/oracle/cross-domain` for cross-domain correlations (show as a new section)

**6. Engine section on Agents page** — Already exists
- The Agents page already has Economy Dashboard with Money Supply, Treasury, Taxes, Realms, Bloodline, Inspection sections pulling from `/api/data`
- No changes needed here — this is already implemented

### Technical details

**Files modified:**
- `src/lib/agents-api.ts` — Switch URL to `zhihuiti-oracle.zeabur.app/api/agents`, adjust field mapping
- `src/pages/dashboard.tsx` — Rewrite to use `/api/status`, `/api/agents`, `/api/evolution` endpoints; show system stats + recent goals
- `src/pages/collision-engine.tsx` — Replace OpenRouter direct call with `supabase.functions.invoke("collide-theories")`, remove API key dialog
- `src/pages/collisions.tsx` — Add useQuery hooks for `/api/oracle/theories/stats` and `/api/oracle/cross-domain`, render stats cards and correlation section

**API base:** `https://zhihuiti-oracle.zeabur.app`  
**Refresh intervals:** 10s for status/agents, 30s for evolution/stats

