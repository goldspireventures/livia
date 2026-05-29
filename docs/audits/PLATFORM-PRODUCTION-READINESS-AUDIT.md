# Platform production-readiness audit (2026-05)

**Purpose:** Honest snapshot of patchwork / drift risk now that **the same git SHA** deploys staging → prod.  
**Audience:** Founders, agents, release reviewers.  
**Re-read when:** Adding env vars, access rules, vertical gates, or onboarding catalog entries.

Aligns with [`LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md) Part 3 and [`WORKFORCE-ONBOARDING.md`](../operations/WORKFORCE-ONBOARDING.md).

---

## Executive summary

| Area | Designed for future? | Reality today |
|------|----------------------|---------------|
| Tenant RBAC + RLS | Yes | Solid — preserve `requireRole`, membership, entitlements |
| Business rules kernel | Yes | `@workspace/policy` exists — **not all surfaces use it** |
| Stg → prod same code | Intended | **Yes on Railway** (`NODE_ENV=production` both) — behaviour must differ **only via env** |
| Workforce / company access | Partial | Types + cockpit DB — **not platform-enforced capabilities yet** |
| Feature flags | Built | **Internal ops only** — tenant apps use hardcoded wedge UI guard |
| URLs / domains | Partial | `public-urls.ts` good pattern — **localhost fallbacks unsafe if env missing on prod** |
| OpenAPI / codegen | Yes | CI gate — **hand-extended client types bypass contract** |

**Verdict:** Architecture docs describe the right shape. Execution has **known lag** — not hopeless patchwork, but **not safe to assume “mostly there” without this checklist**.

---

## Golden rules (staging → production)

1. **Identical artifact, different env** — never `if (staging)` in product code; use env vars documented in `railway.env*.example` + Vercel/EAS project settings.
2. **Prod fail-closed** — unset env must not grant access or point at localhost (beta mode, demo, URLs).
3. **Server enforces, clients display** — no duplicated allowlists in dashboard/mobile/internal Vite env.
4. **Policy or API** — jurisdictions, verticals, tiers, vocabulary from `@workspace/policy` or `/api/onboarding/catalog`, not local constants.
5. **OpenAPI first** — `pnpm codegen`; no hand-edited `lib/api-client-react` / `lib/api-zod`.

---

## Top risks (what could bite on next prod push)

### P0 — prod safety

| Risk | Status |
|------|--------|
| Beta defaults **open** if env unset | **Fixed** — prod defaults `invite` |
| Public URLs fall back to **localhost** | **Fixed** — boot check in prod |
| Wedge / moratorium **UI-only** | **Fixed** — API gates on medspa, class-sessions, design-proofs |

### P1 — drift / patchwork

| Risk | Location | Hiccup |
|------|----------|--------|
| Platform exec copied 3× | `platform-exec.ts` (api, dashboard, mobile) | Stg/prod exec list out of sync |
| Onboarding catalog triplicated | mobile `constants/onboarding.ts`, dashboard `onboarding-labels.ts` | FR / tier packs missing on one surface |
| `livia.io` vs `livia-hq.com` | marketing leads, mobile demo guides, premises UI | Wrong brand / demo domain in prod |
| Workforce tier **label only** | `@workspace/policy` + beta gate | `restricted` vs `full` changes nothing on routes yet |
| Internal ops role **self-declared** | Internal UI headers | Not tied to Clerk or cockpit grants |

### P2 — maintainability

| Risk | Location | Hiccup |
|------|----------|--------|
| Feature flags in DB unused by tenants | `internal-feature-flags.service.ts` | Two toggle systems (flags vs wedge policy) |
| Codegen workarounds | e.g. `staff-params.ts` | Silent API/client drift |
| Mobile no deploy-env concept | relies on `EXPO_PUBLIC_*` at build | Stg mobile needs separate EAS profile |

---

## What is well-designed (do not rip out)

- `@workspace/policy` — verticals, onboarding, workforce types, channels prod guard
- `GET /api/me/tenant-experience` — tenant copy and gates
- `GET /api/onboarding/catalog` — policy-backed catalog (when clients use it)
- Tenant `requireRole` + Postgres RLS
- Demo prod gate (`LIVIA_DEMO_ENABLED` + `LIVIA_DEMO_ALLOW_IN_PRODUCTION`)
- Internal ops: secret + `requireInternalOpsMutation(role)`
- CI codegen check (`scripts/check-codegen.sh`)
- Staging env templates (`railway.env.staging.example`, dashboard `.env.staging.example`)

---

## Target architecture (company + tenant access)

```text
Request
  → Clerk JWT (tenant) OR internal ops secret (company)
  → resolvePlatformPrincipal()  ← single module (api-server)
       · tenant membership / role
       · workforce tier (cockpit grants + @livia-hq.com auto)
       · platform exec flag
       · demo persona flag
  → enforceCapability() on routes
  → GET /api/me + /api/me/workforce-access + /api/me/platform-config
  → clients never parse email domains for authz
```

Workforce access today stops at step “beta signup + labels”; full principal resolver is the next platform milestone.

---

## Remediation backlog (ordered)

| # | Item | Effort |
|---|------|--------|
| 1 | Prod fail-closed: beta mode, URL env required when `NODE_ENV=production` | S |
| 2 | API-side wedge/scope gate mirroring `wedge-gate.ts` | M |
| 3 | `/api/me/platform-config` (deploy env, public URLs, feature bits) — clients drop hostname hacks | M |
| 4 | Remove 3× `platform-exec.ts` — clients use `/api/me` only | S |
| 5 | Onboarding: delete duplicate catalogs; Zod from policy or API | M |
| 6 | `PlatformPrincipal` + capability middleware | L |
| 7 | Finish `livia.io` → `livia-hq.com` / `demo.livia-hq.com` in runtime + Clerk reprovision | M |
| 8 | Wire DB feature flags **or** delete unused tenant flag path | M |

---

## Agent / release checklist

Before merging platform-affecting PRs:

- [ ] Behaviour diff = env var only (document in `ENV-VARIABLES.md`)
- [ ] No new hardcoded domain, exec email, or localhost prod fallback
- [ ] Business rule in `@workspace/policy` or api-server service — not dashboard/mobile string
- [ ] OpenAPI updated if API changed
- [ ] Staging smoke (`pnpm smoke:staging`) if touch deploy surfaces
- [ ] This audit section re-checked if adding access control

---

## Related audits

- [`v1-scope-drift-audit.md`](./v1-scope-drift-audit.md) — wedge / vertical scope
- [`marketing-vs-reality.md`](./marketing-vs-reality.md) — public claims vs code
- [`../operations/WORKFORCE-ONBOARDING.md`](../operations/WORKFORCE-ONBOARDING.md) — workforce honest status
