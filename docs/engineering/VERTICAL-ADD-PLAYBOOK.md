# Vertical add playbook — how a new vertical snaps into Livia

**Status:** canonical (2026-05-30)  
**Audience:** engineering, product, founder  
**Reads with:** [`COMPOSABLE-EVOLUTION.md`](./COMPOSABLE-EVOLUTION.md) §5.3 · [`PLATFORM-LIFECYCLE-REGISTRY.md`](./PLATFORM-LIFECYCLE-REGISTRY.md) · [`LIVIA-PLATFORM-LIFECYCLE.md`](../product/LIVIA-PLATFORM-LIFECYCLE.md) · [`vertical-coverage.ts`](../../lib/policy/src/vertical-coverage.ts)

---

## 0. The question

If Livia is **programmatic**, adding vertical #10 should feel like **blocks shuffling into place** — registry announces it, demo grid picks it up, skins assign, `/b` flows exist, marketing gets a page — not a six-month bespoke project.

**Honest answer:** **Partially true today.** TypeScript **forces** many blocks to exist; several surfaces still need **manual seed/assets**. This playbook lists what snaps automatically vs what humans still do, and the north-star to close the gap.

---

## 1. The hub-and-spoke model

```text
                    ┌─────────────────────────┐
                    │  businessVerticalSchema  │  ← add enum value (Ring 1)
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  Record<BusinessVertical,*>   VERTICAL_COVERAGE_     resolveTenantExperience()
  (compile fails until full)    REGISTRY row           publicExperienceSkin()
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
              Surfaces read API / policy — do not hardcode lists
```

**Mental model:** Add the block at the **center** (`lib/policy`); TypeScript errors are the **missing pieces falling into place**. Surfaces that still hardcode vertical lists are **bugs**.

---

## 2. Checklist — add code vertical `foo`

### 2.1 Ring 1 — Policy (required; TypeScript exhaustiveness)

| Module | `Record<BusinessVertical, …>` | Auto-fail if missing? |
|--------|------------------------------|------------------------|
| `types.ts` | `businessVerticalSchema` enum | ✅ |
| `verticals.ts` | `VERTICAL_PACKS` | ✅ |
| `vertical-playbooks.ts` | `VERTICAL_PLAYBOOKS` | ✅ |
| `vocabulary.ts` | labels via pack | ✅ |
| `vertical-onboarding.ts` | `VERTICAL_ONBOARDING_EXTRAS` | ✅ |
| `continuity-templates.ts` | SMS/WA copy templates | ✅ |
| `booking-guards.ts` | public book fields | ✅ (partial Record OK) |
| `liv-mandate.ts` | mandate defaults | ✅ |
| `presentation-presets.ts` | 4 presets + platform-default path | ✅ |
| `tenant-experience.ts` | accent/shell/display maps | ✅ |
| `wedge-demo-stories.ts` | G1-A interstitial beats | ⚠️ file may not exist yet |
| `guest-surfaces.ts` | P7 surface types | ⚠️ Track G |

**Action:** `pnpm run typecheck` — fix every error in `lib/policy` before touching UI.

### 2.2 Registry — announce platform-wide

Add row to **`VERTICAL_COVERAGE_REGISTRY`** in `vertical-coverage.ts`:

| Field | Purpose |
|-------|---------|
| `docId`, `label`, `tier` | GTM honesty (`heartland` / `beta-full` / `defer`) |
| `codeVertical` | enum value or `null` + `nearestPack` |
| `demoSlug` | seeded showcase tenant |

**Auto-consumers (when wired):**

| Consumer | Endpoint / route |
|----------|------------------|
| Marketing M5 | `/verticals/:slug` copy + CTA |
| Demo grid | `/demo` from registry `tier ≠ defer` |
| Gateway interstitial | `/demo/wedge/:vertical` + `wedge-demo-stories` |
| Public honesty | `GET /public/vertical-coverage` |
| Internal ops | `GET /internal/ops/vertical-coverage` |
| Onboarding catalog | target: sole vertical list (dedupe in progress) |

### 2.3 Ring 2 — API & gates

| Step | Action |
|------|--------|
| OpenAPI | `businessVertical` enum in spec → `pnpm codegen` |
| `wedge-gate.ts` | Add route prefixes if vertical-specific hubs (`/medspa`, `/pets`, …) |
| `public.ts` | Vertical-specific public payloads (guards, procedures) via policy — not switch in route |
| Demo seed | Row in `demo-vertical-shops.seed.ts` or generic seed factory |
| E2E | `pnpm test:e2e:verticals` includes new slug |

### 2.4 Ring 3 — Surfaces (thin renderers)

| World | What updates |
|-------|--------------|
| W1 Marketing | M5 page content (often from registry) |
| W2 Gateway | Wedge tile + interstitial beats |
| W4 Tenant | Ritual home if vertical-specific; toolkit routes from `ROUTE_VERTICALS` |
| W5 `/b` | Vertical template from playbook + guest surfaces |
| W3 Support | `surfaceId` registry rows for new routes |

**Should NOT need edits:** core booking engine, customer model, auth — unless new guest surface type.

### 2.5 Docs (propagate like code — CI enforced)

**Hub:** playbook `docs/product/vertical-playbooks/{vertical}.md` · optional `{NAME}-VERTICAL-PROGRAM.md` while vertical is in active completion.

**Spokes + guard:** [`DOC-PROPAGATION-CASCADE.md`](./DOC-PROPAGATION-CASCADE.md) · `pnpm vertical:doc-check` (included in `pnpm vertical:check`).

| Item | Owner |
|------|-------|
| Playbook + demo index + DEMO-LOGINS slug | Eng/product (same PR as registry) |
| Founder UAT section for canonical demo tenant | Product |
| DOC-CANONICAL-INDEX + LIVIA-STATUS link | Same PR as program doc |

### 2.6 Assets & ops (still manual today)

| Item | Owner |
|------|-------|
| North-star / evolution PNGs | Design |
| Wedge interstitial screenshot crops | Design |
| Demo shop branding images | Seed / assets lib |
| Support runbook vertical notes | Ops |
| `docs/verticals.md` narrative row | Product |

---

## 3. What “fully programmatic” looks like (north-star)

| Today | North-star |
|-------|------------|
| 10+ policy files edited by hand | **`defineVerticalPack({ … })`** single factory registers all Record entries |
| Demo seed per vertical in TS array | **`seedFromVerticalPack('foo')`** reads pack defaults |
| `wedge-demo-stories` separate file | Generated from pack **`demoBeats[]`** |
| `ROUTE_VERTICALS` manual map | Derived from pack **`tenantRoutes[]`** |
| CI only typechecks | **`pnpm vertical:check`** fails if registry row missing demo slug, story beats, or E2E slug |
| Marketing copy in MD | Registry **`marketingTeaser`** fields → M5 template |

**Release gate:** Adding a vertical = one PR to policy factory + registry row + assets; CI proves all worlds render.

---

## 4. Vertical tier vs code vertical

Not every **doc vertical** (V1–V11) is a **code enum**:

| Type | Example | Behavior |
|------|---------|----------|
| Code vertical | `pet-grooming` | Full enum; all Records must include |
| Market variant | V-DK (Copenhagen wellness) | Registry row; reuses `wellness` pack |
| Partner-only | V8 dental | `nearestPack: allied-health`; honest preview badge |
| Defer | V11 adjacent solo | Excluded from demo grid |

---

## 5. Verification script (target)

```bash
pnpm vertical:check   # future — today: typecheck + test:e2e:verticals
```

**Manual smoke after add:**

1. `GET /public/vertical-coverage` lists new vertical  
2. `/demo` shows wedge tile  
3. `/demo/wedge/foo` interstitial renders  
4. Sign-up with `vertical=foo` → tenant experience vocabulary correct  
5. `/b/{demoSlug}` book flow completes  
6. Marketing `/verticals/foo` CTA works  

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Initial playbook — programmatic snap vs manual gaps |
