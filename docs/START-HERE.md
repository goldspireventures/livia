# Start here — engineers

**✅ Build active (2026-05-31):** G-DOC founder sign-off received. Authority: [`product/LIVIA-BUILD-PLAN-V2.md`](./product/LIVIA-BUILD-PLAN-V2.md) + [`product/LIVIA-DOCUMENTATION-PROGRAM.md`](./product/LIVIA-DOCUMENTATION-PROGRAM.md).

**Canonical doc index:** [`DOC-CANONICAL-INDEX.md`](./DOC-CANONICAL-INDEX.md) (when two docs disagree, the index wins).

**Category:** [`product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) — people-business OS, not salon-only.

**Vision + queue (after doc gate):** [`product/LIVIA-WIDE-BUILD-PLAN.md`](./product/LIVIA-WIDE-BUILD-PLAN.md) · **Build v2:** [`product/LIVIA-BUILD-PLAN-V2.md`](./product/LIVIA-BUILD-PLAN-V2.md)  
**Heavy build (locks):** [`product/LIVIA-FINAL-BUILD-PLAN.md`](./product/LIVIA-FINAL-BUILD-PLAN.md) — scope authority before large work.

## Day 1 — run the product

| Step | Doc / command |
|------|----------------|
| What & why | [`LIVIA-ALIGNMENT.md`](./LIVIA-ALIGNMENT.md) |
| Install & run | [`LOCAL_DEV.md`](./LOCAL_DEV.md) |
| Repo map | [`../README.md`](../README.md), [`engineering/REPO-LAYOUT.md`](./engineering/REPO-LAYOUT.md) |
| Demo logins | [`testing/DEMO-LOGINS.md`](./testing/DEMO-LOGINS.md) |

```bash
pnpm install && pnpm run typecheck
pnpm --filter @workspace/db run push
pnpm dev:api    # :3000
pnpm dev:dashboard   # :5173
```

## I need to change…

| Area | Go to |
|------|--------|
| HTTP API | `artifacts/api-server/src/routes/`, `lib/api-spec/openapi.yaml` |
| Database | `lib/db/src/schema/` |
| Business rules & vertical copy | `lib/policy/` |
| Web app | `artifacts/livia-dashboard/src/` |
| Mobile | `artifacts/livia-mobile/` |
| Marketing site | `artifacts/livia-marketing/` |
| Internal ops | `artifacts/livia-internal/` |
| E2E tests | `e2e/tests/` |

## Week 1 — context

| Topic | Doc |
|-------|-----|
| Onboarding checklist | [`onboarding-engineer.md`](./onboarding-engineer.md) |
| ADRs | [`adr/`](./adr/) |
| Launch gates | [`launch-plan.md`](./launch-plan.md) |
| App Store / prod env | [`operations/APP-STORE-PRODUCTION-CHECKLIST.md`](./operations/APP-STORE-PRODUCTION-CHECKLIST.md) |

## Historical programs (read only if debugging old tickets)

These are **archived context**, not the active build plan:

- `product/V2-ENGINEERING-CLOSED.md`
- `product/V2-EXECUTION-PROGRAM.md`
- `product/V1.5-EXECUTION-PROGRAM.md`

Active engineering direction: [`product/LIVIA-FINAL-BUILD-PLAN.md`](./product/LIVIA-FINAL-BUILD-PLAN.md) · [`product/OPERATION-SOLIDIFY.md`](./product/OPERATION-SOLIDIFY.md) · [`product/PLATFORM-RELEASE-PROGRAM.md`](./product/PLATFORM-RELEASE-PROGRAM.md).
