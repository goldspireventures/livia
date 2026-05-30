# Tenant experience contract

**Status:** canonical (2026-05-28)

## Rule

Every owner-facing surface receives **`TenantExperience`** from one resolver (`resolveTenantExperience` in `@workspace/policy`, exposed as `GET /api/me/tenant-experience?businessId=`). UI renders fields — it does not fork vertical copy, theme tokens, or onboarding gates locally.

**Full lifecycle (W1–W5, seed, public booking):** [`LIVIA-PLATFORM-LIFECYCLE.md`](./LIVIA-PLATFORM-LIFECYCLE.md)

**Nested flows (thick guest + thin channels, vertical toolkits):** [`LIVIA-PLATFORM-FLOWS.md`](./LIVIA-PLATFORM-FLOWS.md)

## Signup defaults (founder lock 2026-05-29)

| On `POST /businesses` | Value |
|------------------------|-------|
| **Presentation preset** | `platform-default` (Platform Default / Aurora tenant chrome) |
| **Vertical capability** | From `vertical` field — routes, vocabulary, modules, public P7 flows |
| **Owner may later** | Switch to vertical-native preset in Settings → Appearance (Track D) |

Public `/b/{slug}` uses **business brand + vertical public template** (W5) — not the same resolver path as dashboard skin, but preset/brand tokens merge on Track D5.

## Bundle fields

| Field | Source |
|-------|--------|
| `vocabulary` | `businessVocabulary()` |
| `playbook` | `getVerticalPlaybook()` — wedge, home modules, public CTA |
| `skin` | `resolveTenantExperienceSkin()` — shell, display, market, accentHex; **staging+:** `presetId` (`platform-default` = Aurora), `cssPreset`, `colorMode`, `density`, `layout` ([`../design/PRESENTATION-PRESETS-AND-ROLLOUT.md`](../design/PRESENTATION-PRESETS-AND-ROLLOUT.md)) |
| `onboardingExtras` | `getVerticalOnboardingExtras()` |
| `onboarding.appUnlocked` | `isOnboardingAppUnlocked()` — blocking acts complete |
| `onboarding.activationSteps` | Post-go-live checklist (not a hard app lock) |

## Blocking onboarding (self-serve)

| Gate | Act |
|------|-----|
| Location profile | `a2_shop_profile` |
| Hours | `a5_hours` |
| Liv | `a6_liv` |
| Public link | `a8_public_link` |

Auto-completed on create (seeded): `a1`, `a3`, `a4`.

Test booking is an **activation** step, not an app-store hard lock.

## Surfaces

| Surface | Consumes |
|---------|----------|
| Dashboard onboarding | Theme shell, preview API, vocabulary hints |
| Dashboard home | `ActivationWelcome` |
| Mobile home | `ActivationWelcome` |
| Mobile setup | `onboarding-continue` + tenant experience |
| Public booking | `experienceSkin` from API; **guest surfaces** for proof/consent/visit (Track G) — full spec [`PUBLIC-B-SURFACE-SPEC.md`](./PUBLIC-B-SURFACE-SPEC.md) |

Presentation preset + surface morph (staging): [`../design/SURFACE-AND-BREAKPOINTS.md`](../design/SURFACE-AND-BREAKPOINTS.md).

## CI

- `artifacts/api-server/src/services/__tests__/vocabulary-leak.test.ts`
- `artifacts/api-server/src/services/__tests__/onboarding-program.test.ts`

## Operations

- Release: [`docs/operations/APP-STORE-PRODUCTION-CHECKLIST.md`](../operations/APP-STORE-PRODUCTION-CHECKLIST.md)
- “Really possible” criteria: [`docs/operations/APP-STORE-READINESS.md`](../operations/APP-STORE-READINESS.md)
- Changing this contract: [`engineering/COMPOSABLE-EVOLUTION.md`](../engineering/COMPOSABLE-EVOLUTION.md) §5.1–5.2

## Anti-patterns (do not add)

- Duplicate `VERTICAL_OPTIONS` / `ONBOARDING_VERTICALS` lists — use `/onboarding/catalog`
- Hardcoded salon/stylist copy in tenant UI
- `percentComplete === 100` as the only app-unlock check
