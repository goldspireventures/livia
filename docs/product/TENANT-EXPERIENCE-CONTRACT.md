# Tenant experience contract

**Status:** canonical (2026-05-28)

## Rule

Every owner-facing surface receives **`TenantExperience`** from one resolver (`resolveTenantExperience` in `@workspace/policy`, exposed as `GET /api/me/tenant-experience?businessId=`). UI renders fields — it does not fork vertical copy, theme tokens, or onboarding gates locally.

## Bundle fields

| Field | Source |
|-------|--------|
| `vocabulary` | `businessVocabulary()` |
| `playbook` | `getVerticalPlaybook()` — wedge, home modules, public CTA |
| `skin` | `resolveTenantExperienceSkin()` — shell, display, market, accentHex |
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
| Public booking | `experienceSkin` from API (unchanged) |

## CI

- `artifacts/api-server/src/services/__tests__/vocabulary-leak.test.ts`
- `artifacts/api-server/src/services/__tests__/onboarding-program.test.ts`

## Operations

- Release: [`docs/operations/APP-STORE-PRODUCTION-CHECKLIST.md`](../operations/APP-STORE-PRODUCTION-CHECKLIST.md)
- “Really possible” criteria: [`docs/operations/APP-STORE-READINESS.md`](../operations/APP-STORE-READINESS.md)

## Anti-patterns (do not add)

- Duplicate `VERTICAL_OPTIONS` / `ONBOARDING_VERTICALS` lists — use `/onboarding/catalog`
- Hardcoded salon/stylist copy in tenant UI
- `percentComplete === 100` as the only app-unlock check
