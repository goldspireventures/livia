# Workforce onboarding (company identity)

**Not customer onboarding.** How Livia Inc and Goldspire staff get access.

## Three email classes (do not mix)

| Class | Domain | Purpose |
|-------|--------|---------|
| **Company staff** | `@livia-hq.com` | Livia Inc employees |
| **Partner staff** | `@goldspireventures.com` | Goldspire — **cockpit grant only** |
| **Demo personas** | `@demo.livia-hq.com` (legacy `@livia.io`) | Synthetic tenant UAT — not real people |

Production product URLs use **`livia-hq.com`** (`app.`, `api.`, marketing). `@livia.io` is legacy demo/docs only.

## Platform access control — honest status

**What is modular today**

| Layer | Mechanism | Scope |
|-------|-----------|--------|
| Tenant RBAC | `requireRole`, membership | Per business (OWNER → STAFF) |
| Plan entitlements | `requireEntitlement` | Per business feature flags |
| Internal ops | `requireInternalOpsMutation(role)` | Ops API routes |
| Policy kernel | `@workspace/policy` | Shared rules (verticals, onboarding, workforce *types*) |

**What workforce access does today (narrow)**

- Beta signup / shop creation (`evaluateBetaSignup`)
- Cockpit grant CRUD (`internal_workforce_access_grants`)
- `GET /me/workforce-access` — authoritative tier for signed-in Clerk user
- Internal `/join` checklist copy

**What it does *not* do yet (platform-wide gap)**

- `restricted` vs `full` **does not change API behaviour** — both tiers pass beta signup the same way
- No `requireWorkforceCapability(...)` middleware on routes
- Dashboard/mobile do not gate surfaces from `/me/workforce-access` (dashboard still guesses locally)
- Internal ops role is **self-declared** in the UI header, not derived from workforce tier
- Exec redirect still uses `LIVIA_PLATFORM_EXEC_EMAILS` (separate allowlist)

**Target shape (when you want true platform-wide control)**

1. Resolve **platform principal** once per request: `{ kind: customer | workforce | demo, tier?, internalRole? }`
2. Store grants + role bindings in DB (cockpit is the admin UI for Goldspire)
3. Single enforcement helper on API + `/me` exposes capabilities to clients
4. Clients never re-implement domain rules

Until step 3 exists, treat workforce tiers as **labels for ops** plus beta bypass — not a full capability system.

## Tier names (what we meant)

| Tier | Who | Meaning *today* |
|------|-----|-----------------|
| **none** | Customers, ungranted Goldspire | Normal product rules only |
| **restricted** | `@livia-hq.com` auto | “Company staff, not auto-exec” — staging-friendly default; **not enforced on routes yet** |
| **full** | Cockpit-granted Goldspire (or future promotion) | Intended for broader internal access — **not enforced on routes yet** |

“Restricted” was never “blocked from prod” — it meant **don’t assume full operator powers** (exec list, destructive automations, etc.). Those stay on separate checks until we wire a capability matrix.

## Goldspire = cockpit only

Every `@goldspireventures.com` inbox must be granted in **exec cockpit → Goldspire workforce access**.

Grants control beta signup and record tier (`restricted` | `full`). Revoke in cockpit removes grant on next request.

## Livia staff (@livia-hq.com)

Automatic **restricted** tier in policy — no cockpit step.

Exec redirect (`app` → ops) still requires `LIVIA_PLATFORM_EXEC_EMAILS`.

## Beta signup gate

| Mode | Customers | `@livia-hq.com` | Cockpit-granted Goldspire | Demo |
|------|-----------|-----------------|---------------------------|------|
| open | ✓ | ✓ | ✓ | ✓ |
| invite | invite list only | ✓ | ✓ | ✓ |
| closed | ✗ | ✓ | ✓ | ✓ |

## Env (Railway / Vercel)

```env
LIVIA_STAFF_EMAIL_DOMAINS=livia-hq.com
GOLDSPIRE_STAFF_EMAIL_DOMAINS=goldspireventures.com
LIVIA_PLATFORM_EXEC_EMAILS=projectlazarus@livia-hq.com
```

## Database migration

Run `pnpm db:migrate:sql` (includes `026-workforce-access-grants.sql`) before cockpit grants in production.

## Reads with

- [`EXEC-COMMAND-CENTER.md`](./EXEC-COMMAND-CENTER.md)
- [`ENV-VARIABLES.md`](./ENV-VARIABLES.md)
