# Code clarity standards — findable, modular, future-proof

**Status:** canonical (2026-05-31)  
**Audience:** engineering, agents, future internal dev (Goldspire + Livia)  
**Purpose:** How we name, split, and wire code so the next team can **find what does what** without oral history — including **Atlas** (company knowledge) integration points.

**Reads with:** [`REPO-LAYOUT.md`](./REPO-LAYOUT.md) · [`COMPOSABLE-EVOLUTION.md`](./COMPOSABLE-EVOLUTION.md) · [`PLATFORM-TERMINOLOGY.md`](../PLATFORM-TERMINOLOGY.md) · [`ATLAS-INTEGRATION-GUIDE.md`](./ATLAS-INTEGRATION-GUIDE.md)

---

## 1. Principles

| Principle | Meaning |
|-----------|---------|
| **Hub first** | Business rules live in `lib/policy` — surfaces and API are thin |
| **One obvious home** | Every feature has one canonical module; no duplicate vertical lists |
| **Name the job** | Files and exports describe *what* not *how* (`demo-showcase-depth.ts`, not `helpers2.ts`) |
| **Small seams** | Services call services; routes stay thin; cross-cutting in `lib/*` |
| **Atlas-ready** | Runbooks, surface IDs, and tool names match docs — Atlas links to code paths |

---

## 2. Naming conventions

### 2.1 Monorepo layout

| Path | Contains |
|------|----------|
| `lib/policy/src/` | SSOT types, catalogs, guards — **no I/O** |
| `lib/db/src/schema/` | Drizzle tables grouped by domain (`internal-ops/`, `bookings/`) |
| `artifacts/api-server/src/routes/` | HTTP adapters — validate, call service, respond |
| `artifacts/api-server/src/services/` | Business logic — one domain per file cluster |
| `artifacts/*/src/pages/` or `views/` | Surface routes — no policy forks |
| `docs/design/screen-cards/` | L3 UX spec per screen (`w5.public.book.mobile.yaml`) |

### 2.2 File names

- **Services:** `{domain}.service.ts` or `{domain}-{sub}.service.ts` (e.g. `exec-work-events.service.ts`)
- **Seeds:** `demo-{scope}.seed.ts` — scope = vertical, market, roster
- **Policy modules:** noun or noun-phrase (`guest-surfaces.ts`, `exec-hats.ts`)
- **Routes:** plural resource or nested path matching OpenAPI (`internal-ops.ts`, `demo.ts`)
- **Tests:** co-located `__tests__/` or `*.test.ts` next to module

### 2.3 Identifiers

| Kind | Pattern | Example |
|------|---------|---------|
| `surfaceId` | `{world}.{feature}` | `w5.proof`, `w4.ops.inbox` |
| Exec hat | `ExecHatId` from policy | `ceo`, `cto` — not free strings |
| Feature flag | `snake_case` key | `guest_hub_beta` |
| Demo slug | kebab, locale hint | `ink-anchor-galway` |
| Liv tool | `snake_case` registry name | `find_slots`, `create_booking` |

---

## 3. Modularity rules

1. **Policy → API → UI** — never UI → policy copy hardcoded.
2. **No god services** — if a file exceeds ~400 lines, split by subdomain (read vs write, seed vs runtime).
3. **Shared types** export from `@workspace/policy` or `@workspace/db`, not duplicated in artifacts.
4. **Generated clients** — run `pnpm codegen` after OpenAPI change; never hand-edit `api-client-react`.
5. **Vertical fan-out** — use `Record<BusinessVertical, T>` or registry helpers; missing key = compile error.

---

## 4. Findability checklist

Before merging non-trivial work:

| Question | Where to look / update |
|----------|------------------------|
| What screen is this? | Screen card YAML + `VISUAL-SCREEN-MASTER-INVENTORY.md` |
| What API owns this? | OpenAPI → route file → service |
| What rule governs copy? | `lib/policy` + `GET /me/tenant-experience` |
| How do I demo it? | `PER-VERTICAL-DEMO-SEED.md` + demo slug in config |
| How does support triage? | `surfaceId` + [`SUPPORT-POINTS-AND-INVESTIGATION.md`](../operations/SUPPORT-POINTS-AND-INVESTIGATION.md) |
| What does Liv call? | [`LIV-TOOL-REGISTRY-MATRIX.md`](../product/LIV-TOOL-REGISTRY-MATRIX.md) + `lib/liv-runtime` registry |

---

## 5. Robustness

- **Typed errors** — HTTP status on thrown errors in services; routes map to `sendError`.
- **Idempotent seeds** — demo refresh safe to re-run; no duplicate bookings on refresh.
- **Rate limits** — external APIs (Clerk) gated; skip when no net-new work.
- **Feature flags** — ship dark; enable per tenant via internal ops.
- **Migrations** — numbered SQL in `lib/db/migrations/sql/`; one concern per file.

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial code clarity standards (founder + internal dev handoff) |
