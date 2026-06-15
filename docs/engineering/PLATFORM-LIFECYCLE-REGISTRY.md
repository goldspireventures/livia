# Platform lifecycle registry — register once, cascade down

**Status:** canonical target architecture (2026-05-30)  
**Audience:** engineering, agents  
**Reads with:** [`VERTICAL-ADD-PLAYBOOK.md`](./VERTICAL-ADD-PLAYBOOK.md) · [`LIVIA-WIDE-BUILD-PLAN.md`](../product/LIVIA-WIDE-BUILD-PLAN.md) §3 · [`COMPOSABLE-EVOLUTION.md`](./COMPOSABLE-EVOLUTION.md)

---

## 1. Problem

Today, adding a vertical or onboarding a business requires **human memory** of 10+ touchpoints. The **policy hub** enforces compile-time completeness, but **downstream consumers** (demo seed, E2E, marketing, wedge stories) are still manual.

**Goal:** One registration event → validated fan-out → surfaces stay coherent without grep.

---

## 2. Two registration types

### 2.1 Vertical registration (platform-level)

**Trigger:** New `BusinessVertical` enum value + pack definition.

**Hub (Ring 1):** `lib/policy` — all `Record<BusinessVertical, T>` must include the value or TypeScript fails.

**Registry row:** `VERTICAL_COVERAGE_REGISTRY` in `vertical-coverage.ts`.

**Consumers (must read registry or policy — never hardcode lists):**

| Consumer | Today | Target |
|----------|-------|--------|
| Marketing M5 | partial manual | registry `marketingTeaser` |
| Demo gateway wedge grid | `listWedgeDemoVerticals()` | registry `tier ≠ defer` |
| Demo seed shop | `demo-vertical-shops.seed.ts` | `seedFromVerticalPack(id)` |
| E2E | `all-verticals-smoke` | registry `demoSlug` required |
| Wedge interstitial | `wedge-demo-stories.ts` | pack `demoBeats[]` |
| Public `/b` | playbook + guest surfaces | automatic from pack |
| Support ops | — | registry `docId` in runbook |

**Verification (R3):** `pnpm vertical:check` fails if any consumer row missing.

### 2.2 Business registration (tenant-level)

**Trigger:** `POST /api/businesses` (or demo provision).

**Hub:** `createBusiness()` + optional `seedVerticalStarterPack()` / legacy `seedBusinessFromOnboardingPack()`.

**Already cascades:**

- Vertical pack → `livPackConfig`, mandate, operational policy  
- Jurisdiction → currency, locale, timezone  
- Empty studio by default (`a1` only); opt-in starter pack → template menu + staff (+ beauty retail)  
- `EventType.BUSINESS_CREATED` logged  

See [`VERTICAL-STARTER-PACK.md`](./VERTICAL-STARTER-PACK.md).

**Consumers:**

| Consumer | Today | Target |
|----------|-------|--------|
| Tenant UI | `GET /me/tenant-experience` | ✓ |
| Public `/b` | public API + playbook | ✓ |
| Onboarding wizard | blocking acts from policy | ✓ |
| Morning briefing | on first open / live day | ensureLiveDay hook |
| Support | — | auto `surfaceId` + tenant health row |
| Internal Radar | — | R2 stuck-onboarding feed |

**Target handler (R2–R3):** `platform-lifecycle.service.ts` — single post-create pipeline; routes call it instead of inline seed only.

---

## 3. Target module layout (R3) — shipped 2026-06-14

```text
artifacts/api-server/src/platform/
  lifecycle/
    on-business-created.ts    # tenant birth + mutation fan-out
    index.ts
lib/policy/src/
  propagation/                # manifest compiler, routing, clearance
  vertical-pack-factory.ts    # defineVerticalPack()
scripts/
  propagation-check.mjs         # border control CI
  propagation-impact.mjs        # change-impact router
  vertical-check.mjs            # includes propagation-check
```

Authority: [`PROPAGATION-PROGRAM.md`](./PROPAGATION-PROGRAM.md).

---

## 4. Event model (optional Ring 3)

Today: synchronous in request path + `eventsTable` audit log.

North-star: Inngest (or similar) for async fan-out — **booking created**, **onboarding stuck 7d**, **zero bookings 14d**. Product rules stay in policy; handlers subscribe to typed events.

Do **not** put act renames or copy in event handlers — [`COMPOSABLE-EVOLUTION.md`](./COMPOSABLE-EVOLUTION.md) Ring 3 rule.

---

## 5. CI gates (progressive)

| Gate | When | Command |
|------|------|---------|
| Policy exhaustiveness | Now | `pnpm run typecheck` |
| Vertical E2E | Now | `pnpm test:e2e:verticals` |
| Registry ↔ demo slug | R2 | `pnpm vertical:check` (stub) |
| Full headless lifecycle | R3 | `pnpm lifecycle:headless` |
| surfaceId on new routes | R2 | lint or CI script |

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Initial target architecture doc |
