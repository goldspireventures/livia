# Guest surfaces — policy catalog vs routes audit

**Status:** canonical (2026-05-31)  
**Audience:** engineering, support  
**Purpose:** Reconcile [`guest-surfaces.ts`](../../lib/policy/src/guest-surfaces.ts) with dashboard routes, API handlers, and demo coverage.

**SSOT:** `lib/policy/src/guest-surfaces.ts` — do not duplicate vertical lists in UI.

---

## 1. Catalog summary

| Type | Route | Token | Verticals | surfaceId |
|------|-------|-------|-----------|-----------|
| storefront | `/b/{slug}` | no | all | `w5.storefront` |
| liv-chat | embedded | no | all | `w5.liv-chat` |
| visit | `/b/{slug}/visit/:token` | yes | all | `w5.visit` |
| proof | `/b/{slug}/proof/:token` | yes | body-art | `w5.proof` |
| consent | `/b/{slug}/intake/:token` | yes | medspa, allied-health | `w5.consent` |
| deposit-pay | `/b/{slug}/pay/:token` | yes | body-art, hair, beauty, medspa | `w5.deposit-pay` |
| waitlist-accept | `/b/{slug}/waitlist/:token` | yes | fitness | `w5.waitlist-accept` |

---

## 2. Implementation status

| Type | Dashboard route | Public API | Demo token | E2E |
|------|-----------------|------------|------------|-----|
| storefront | ✅ `PublicBookPage` | ✅ | ✅ all verticals | ✅ |
| liv-chat | ✅ embed | ✅ | ✅ | partial |
| visit | ✅ | ✅ | ✅ | ✅ |
| proof | ✅ `PublicProofPage` | ✅ + decision | ✅ body-art | ✅ `demo-proof-token` |
| consent | ✅ `PublicIntakePage` | 🔨 partial | 🔨 medspa | 📋 |
| deposit-pay | ✅ `PublicPayPage` | 🔨 Stripe | 📋 | 📋 |
| waitlist-accept | ✅ `PublicWaitlistPage` | ✅ accept | ✅ fitness | ✅ `demo-waitlist-token`, `guest-token-*` |

---

## 3. API helpers

| Concern | Location |
|---------|----------|
| Catalog | `lib/policy/src/guest-surfaces.ts` |
| Demo proof token | `GET /api/demo/guest-surfaces/:slug/proof` |
| Demo waitlist token | `GET /api/demo/guest-surfaces/:slug/waitlist` |
| TTL enforcement | api-server token services (per type) |
| Support context | `surfaceId` on tickets → registry in support-points |

---

## 4. Gaps (R2)

1. Wire consent + deposit-pay dashboard routes to match policy route patterns.
2. Fitness waitlist accept flow end-to-end.
3. Extend E2E matrix in [`DEMO-FULL-SHOWCASE.md`](../testing/DEMO-FULL-SHOWCASE.md).
4. Regenerate this audit when routes change (agent checklist item).

---

## 5. Related

- [`PUBLIC-B-SURFACE-SPEC.md`](../design/PUBLIC-B-SURFACE-SPEC.md)
- [`LIV-TOOL-REGISTRY-MATRIX.md`](../product/LIV-TOOL-REGISTRY-MATRIX.md)
- [`PER-VERTICAL-DEMO-SEED.md`](../product/PER-VERTICAL-DEMO-SEED.md)

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial guest surfaces audit |
