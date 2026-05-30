# Agent instructions (Cursor / CI)

Read this before large edits or refactors.

## Must read first

1. [`docs/product/LIVIA-FINAL-BUILD-PLAN.md`](docs/product/LIVIA-FINAL-BUILD-PLAN.md) — **master build scope**
2. [`docs/LIVIA-ALIGNMENT.md`](docs/LIVIA-ALIGNMENT.md)
3. [`docs/PLATFORM-TERMINOLOGY.md`](docs/PLATFORM-TERMINOLOGY.md)
4. [`docs/START-HERE.md`](docs/START-HERE.md)
5. [`docs/DOC-CANONICAL-INDEX.md`](docs/DOC-CANONICAL-INDEX.md)

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

## Production

- Domain: **livia-hq.com** (`app.`, `api.`).
- Demo off in production: `LIVIA_DEMO_ENABLED` not set; see `artifacts/api-server/src/lib/demo-portal-config.ts`.
