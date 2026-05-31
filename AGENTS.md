# Agent instructions (Cursor / CI)

Read this before large edits or refactors.

**⏸ Build paused (2026-05-31):** Prefer **documentation** over feature code until [`docs/product/LIVIA-DOCUMENTATION-PROGRAM.md`](docs/product/LIVIA-DOCUMENTATION-PROGRAM.md) gate **G-DOC** passes. Category: [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](docs/product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md).

## Must read first

1. [`docs/product/LIVIA-DOCUMENTATION-PROGRAM.md`](docs/product/LIVIA-DOCUMENTATION-PROGRAM.md) — **doc sprint (active)**
2. [`docs/product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](docs/product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) — **category — not salon-shaped**
3. [`docs/design/UI-UX-MASTER-PROGRAM.md`](docs/design/UI-UX-MASTER-PROGRAM.md) — **UX authority**
4. [`docs/product/LIVIA-WIDE-BUILD-PLAN.md`](docs/product/LIVIA-WIDE-BUILD-PLAN.md) — vision + build sequencing (after doc gate)
5. [`docs/product/LIVIA-BUILD-PLAN-V2.md`](docs/product/LIVIA-BUILD-PLAN-V2.md) — build authority after G-DOC
6. [`docs/product/LIVIA-FINAL-BUILD-PLAN.md`](docs/product/LIVIA-FINAL-BUILD-PLAN.md) — master build scope (locks)
7. [`docs/LIVIA-ALIGNMENT.md`](docs/LIVIA-ALIGNMENT.md)
8. [`docs/PLATFORM-TERMINOLOGY.md`](docs/PLATFORM-TERMINOLOGY.md)
9. [`docs/START-HERE.md`](docs/START-HERE.md)
10. [`docs/DOC-CANONICAL-INDEX.md`](docs/DOC-CANONICAL-INDEX.md)

## Before you edit (narrow task + system-wide vision)

Every change should answer **both**:

1. **Local:** What file/feature am I fixing and what is the minimal correct diff?
2. **Platform:** What else must stay in sync so Livia stays coherent?

**Cascade map** (things call each other — do not bypass):

```text
lib/policy (vertical, onboarding, presets, guest surfaces)
    → API routes + services (createBusiness, tenant-experience, public /b)
    → codegen (OpenAPI → api-client-react)
    → artifacts/* surfaces (dashboard, mobile, marketing, internal — thin renderers)
    → demo seed + E2E + registry (VERTICAL_COVERAGE_REGISTRY)
```

**Checklist before claiming done:**

| If you touched… | Also verify… |
|-----------------|--------------|
| New/changed **vertical** | All `Record<BusinessVertical, …>` in policy; registry row; demo slug; `/b` + tenant-experience; see [`VERTICAL-ADD-PLAYBOOK.md`](docs/engineering/VERTICAL-ADD-PLAYBOOK.md) |
| New/changed **business create/seed** | `POST /businesses` path, onboarding acts, public `/b`, demo parity; [`LIVIA-PLATFORM-LIFECYCLE.md`](docs/product/LIVIA-PLATFORM-LIFECYCLE.md) §3 |
| **Demo gateway / roster** | Structure vs vertical scenarios; Clerk sync scope; chain HQ vs location owner emails |
| **Public `/b` or guest flow** | Playbook + guest surfaces in policy; all verticals with same pattern, not one-off |
| **UI copy/nouns** | `GET /me/tenant-experience` / vocabulary — not hardcoded "salon" |
| **New route/surface** | W1–W6 boundary; support `surfaceId` if ops-facing |

**North-star (not fully automated yet):** register once at the hub → downstream consumers update via policy + CI, not manual grep. Target: `defineVerticalPack()` + `pnpm vertical:check` ([`LIVIA-FINAL-BUILD-PLAN.md`](docs/product/LIVIA-FINAL-BUILD-PLAN.md) §2).

## Architecture

- **Monorepo (pnpm):** `artifacts/*` deployable apps, `lib/*` shared packages.
- **Tenant copy:** resolve via `@workspace/policy` and `GET /api/me/tenant-experience` — do not duplicate vertical lists or hardcode salon-only owner UI.
- **Experience layers:** capability → presentation preset → brand → persona → surface. Master spec: [`docs/design/EXPERIENCE-ARCHITECTURE.md`](docs/design/EXPERIENCE-ARCHITECTURE.md). Build plan: [`docs/product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](docs/product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md) Track D. Contract: [`docs/product/TENANT-EXPERIENCE-CONTRACT.md`](docs/product/TENANT-EXPERIENCE-CONTRACT.md).
- **Onboarding:** blocking gates in `lib/policy/src/onboarding-program.ts`; web `onboarding-wizard`, mobile `onboarding-setup`. Hub changes: [`docs/engineering/COMPOSABLE-EVOLUTION.md`](docs/engineering/COMPOSABLE-EVOLUTION.md) §5.1.
- **Composable evolution:** product rules change at the hub (policy → API → thin surfaces). Full model: [`docs/engineering/COMPOSABLE-EVOLUTION.md`](docs/engineering/COMPOSABLE-EVOLUTION.md). Program: [`docs/product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](docs/product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md).
- **Platform surfaces (W1–W3):** [`docs/design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](docs/design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) · releases [`docs/product/PLATFORM-RELEASE-PROGRAM.md`](docs/product/PLATFORM-RELEASE-PROGRAM.md).
- **Support / investigation:** tickets carry `requestId`; target `surfaceId` + registry — [`docs/operations/SUPPORT-POINTS-AND-INVESTIGATION.md`](docs/operations/SUPPORT-POINTS-AND-INVESTIGATION.md).
- **Exec company workforce (Track H):** when shipped, meaningful build sessions log to an exec hat via `pnpm exec:hat-work` — spec [`INTERNAL-EXEC-COCKPIT-SPEC.md`](docs/product/INTERNAL-EXEC-COCKPIT-SPEC.md) §4.2b · program Track H in [`PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](docs/product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md). Declare hat at session start; emit one work event before closing non-trivial tasks.
- **Do not edit** generated `lib/api-zod` or `lib/api-client-react` by hand — run `pnpm codegen`.

## Quality bar

- `pnpm run typecheck` before claiming done.
- Minimal diff; match surrounding style.
- No secrets in repo; use `.env.example` only.
- **Code clarity:** naming, one-home modules, policy-first — [`CODE-CLARITY-STANDARDS.md`](docs/engineering/CODE-CLARITY-STANDARDS.md). Atlas/search alignment — [`ATLAS-INTEGRATION-GUIDE.md`](docs/engineering/ATLAS-INTEGRATION-GUIDE.md).
- **UX:** premium motion restraint — [`PREMIUM-MOTION-LAYER.md`](docs/design/PREMIUM-MOTION-LAYER.md) + [`UI-UX-MASTER-PROGRAM.md`](docs/design/UI-UX-MASTER-PROGRAM.md).

## Production

- Domain: **livia-hq.com** (`app.`, `api.`).
- Demo off in production: `LIVIA_DEMO_ENABLED` not set; see `artifacts/api-server/src/lib/demo-portal-config.ts`.
