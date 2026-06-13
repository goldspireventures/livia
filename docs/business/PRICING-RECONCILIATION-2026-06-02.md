# Pricing reconciliation — locked 2026-06-02

**Status:** Founder-locked for design-partner / pre-GA phase  
**Authority chain:** `lib/entitlements` `PLAN_CATALOGUE` → API billing → marketing `pricing-catalog.ts` → this doc → [`pricing-and-packaging.md`](./pricing-and-packaging.md) (F9)

---

## Decision summary

| Topic | Locked choice | Notes |
|-------|---------------|-------|
| **Customer-facing tiers** | F9 hybrid — **Solo €79 · Studio €149 · Chain €249/shop · Host €99 + €19/renter** | Retired legacy **€49 / €99 / €149** from launch-plan and ops docs |
| **Pricing model shape** | Base + seats + voice outcome share | Unchanged — still correct for people-business OS |
| **Voice cap** | **Monthly digest cap per plan** (not €5/booking) | Solo €50/mo · Studio €150/mo · Host €100/mo · Chain uncapped in catalogue |
| **Seat billing (Stripe v1)** | Flat **€15/seat** on Studio/Chain; **€19/renter** on Host | Role-based ladder (€4–€15) is **target for v1.5** — documented in F9, not yet in Stripe |
| **Public marketing hero** | Studio **€149/mo** with Solo floor in FAQ | Closed beta free; list prices lock at GA |
| **Voice % default** | **Off until digest proof** from design partners | Opt-in when weekly digest shows recovered bookings |
| **GA price review** | Revisit list prices **after 10 paying cells** with real voice digest data | Optional modest bump (e.g. Solo €89) — structure unchanged |
| **Event Operator pack** | **€49/mo** add-on — `event_operator_pack` in `ADDON_CATALOGUE` | Consult-first stack gated; design partners get pack during DP window |

---

## Retired references (do not use)

These were early Gate 3 placeholders and conflict with F9:

- Solo **€49** → **€79**
- Studio **€99** → **€149**
- Chain **€149** → **€249/shop**

Files updated in this reconciliation: `launch-plan.md`, `tenancy-and-billing.md`, `demo-script.md`, `pricing-one-pager-external.md`, `terms-of-service.md`, `marketing-vs-reality.md` (row 4a note).

---

## Code ↔ doc alignment

| Surface | Source |
|---------|--------|
| Plan cents + entitlements | `lib/entitlements/src/index.ts` `PLAN_CATALOGUE` |
| Marketing copy | `artifacts/livia-marketing/src/lib/pricing-catalog.ts` |
| In-app billing cards | `artifacts/livia-dashboard/src/components/billing-controls.tsx` |
| Stripe products (Gate 3) | Must mirror `CHECKOUT_PLAN_IDS` + `PLAN_CATALOGUE` cents |

**CI / manual check:** `pnpm run typecheck`; marketing E2E asserts Solo €79 on `/pricing`.

---

## Seat billing roadmap

**Now (v1 Stripe):** quantity-based line item at flat `seatEurCentsPerMonth` from catalogue.

**v1.5:** map Clerk persona role → F9 seat rate (Manager €15 · Senior-w-admin €12 · Staff €8 · Receptionist €10 · Apprentice €4) in metering + invoice breakdown.

Worked examples in F9 (Conor, Roisín) assume role-based seats — treat as **target ARPU**, not current Stripe behaviour.

---

## Voice outcome share

- **Rate:** 4% on bookings Liv attributes to voice recovery (missed-call path).
- **Cap:** monthly total per plan (`voiceOutcomeCapEurCents`); shown in owner weekly digest and billing card.
- **Settlement:** `lib/metering` + monthly job (Inngest/cron) — scaffold per master build plan.

Supersedes earlier draft language of "€5 per booking" in ToS and F9 — that framing was harder to explain and less buyer-friendly than a digest-visible monthly cap.

---

## Entitlements honesty (marketing)

Solo/Studio catalogue grants features still gated pre-GA (deposits, WhatsApp inbound, etc.). Marketing must use **"deposit-ready at launch"** / **"when your plan allows"** per [`marketing-vs-reality.md`](../audits/marketing-vs-reality.md). Do not lead with capabilities not live.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-02 | Initial lock — F9 canonical, legacy tiers retired, voice cap unified on monthly digest |
