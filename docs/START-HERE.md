# Start here — engineers

**Canonical doc index:** [`DOC-CANONICAL-INDEX.md`](./DOC-CANONICAL-INDEX.md) (when two docs disagree, the index wins).

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

Active engineering direction: [`product/OPERATION-SOLIDIFY.md`](./product/OPERATION-SOLIDIFY.md) and [`product/SYSTEM-REALIGNMENT-PROGRAM.md`](./product/SYSTEM-REALIGNMENT-PROGRAM.md) (realignment complete; maintenance mode).
