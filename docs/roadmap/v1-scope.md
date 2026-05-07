# v1 scope — the wedge ship

**Status:** v1 lock (2026-05-07). Target ship: 2026 H2 (Gate 3 of `docs/launch-plan.md`). Acceptance: per Gate 3 in launch plan + the additions below.

## v1 promise (one sentence)

Liv is the operator-as-a-service for **Hair-vertical, English-IE, single-shop** salons (P2b solo and P2a single-shop with Manager) on the Aurora-Midnight surface, with voice receptionist, WhatsApp/SMS booking, scoped role hierarchy, audit-log-as-product-surface, and a privacy-first posture.

## What's in v1 (the explicit feature ledger)

### Personas served at v1
- **P2b Owner-no-Mgr (Conor pattern)** — Rung 3 → Rung 5 by year-end. The deepest cell.
- **P2a Owner-with-Mgr (Roisín pattern)** — Rung 3 → Rung 4 by year-end.
- **P3 Manager (Niamh pattern)** — Rung 3 baseline.
- **P4 Senior-w-admin (Sarah pattern)** — Rung 2 → Rung 3 within scope.
- **P5 Staff** — Rung 1 → Rung 2 (My Day, time-off submit, customer prefs).
- **P6 Receptionist** — Rung 2–3 where present.
- **P7 Customer (CT2 Regular, CT3 New, CT4 Drift target)** — Rung 2–3 booking + reschedule + drift recovery.

### Configurations served at v1
- C1 Solo mobile (light support — primarily P2b solo edge)
- C2 Solo single-chair
- C4 Single-shop with staff (≤8)
- C5 Single-shop with Manager (≤14 staff)

### Verticals at v1
- **Hair only.** Beauty, Body art, Wellness, Fitness, Medspa, Allied health are NOT v1.

### Locales at v1
- **English-IE only** for voice receptionist (the deepest commitment).
- English-UK for text surfaces (cockpit, mobile, customer DM) — accepted because ROI < voice retraining cost.

### Modalities at v1
- **Visual:** owner cockpit (web), mobile flagship, customer booking page, audit-log surface.
- **Conversational:** WhatsApp Business (inbound + outbound), SMS via Twilio.
- **Voice:** inbound voice receptionist (English-IE; per-tenant phone number; missed-call recovery; appointment booking via voice).
- **Passive:** weekly digest (Sunday 18:00 local); morning briefing (Mon–Sat 07:30 local); drift detection.

### Workflows at v1 (per `docs/workflows/`)
- ✅ `book` (visual + conv + voice)
- ✅ `refund-request` with cap-bound ladder
- ✅ `no-show` with deposit + soft-touch + waitlist
- ✅ `time-off-request` with scoped approval
- ✅ `weekly-digest` (Sunday)
- ✅ `owner-on-holiday` handoff
- ✅ `liv-was-wrong` with auto-rollback + human-approved rollback classes

### Features at v1 (per `docs/features/`)
- ✅ `mobile-today-view` (P5 Staff anchor surface)
- ✅ `voice-receptionist` (the wedge)
- ✅ `audit-log-search` (the trust-amplification surface)
- ✅ `whatsapp-booking-flow`
- ⚠️ `cross-tenant-intelligence` — **scaffolding only at v1**; first peer-set insights at v1.5 once k≥10 reached.

### Roles + delegation at v1 (ADR 0009 + ADR 0010)
- OWN, ADM, ADM-D (Senior-w-admin scope), STA, REC.
- `memberships`, `delegations`, `reports_to` first-class.
- Cap-bound refund authority per role.
- Scoped time-off approval per role.

### Migration tooling at v1
- ✅ Phorest data export broker (concierge-led)
- ✅ Universal CSV importer
- ✅ 30-day parallel-run reconciliation tool
- ✅ Phorest read-only access for 90 days post-cutover
- ⚠️ Booksy CSV importer (yes if design-partner demand)
- ❌ Fresha API broker (v1.5)
- ❌ Square API broker (v1.5)
- ❌ Vagaro / Acuity / Timely / Mindbody brokers (v2)

### Pricing tiers at v1 (per `docs/business/pricing-and-packaging.md`)
- ✅ Solo (€79/mo)
- ✅ Studio (€149/mo)
- ❌ Chain (€249/shop) — v1.5 (no chain customers in design-partner cohort 1)
- ❌ Host (€99 + €19/renter) — v1.5
- ❌ Multi-brand — v1.5

### Integrations at v1
- ✅ Stripe (subscription billing + Stripe Connect for shop deposits/tips)
- ✅ Twilio (SMS + voice numbers, IE A2P 10DLC registered)
- ✅ Resend (transactional email)
- ✅ WhatsApp Business API (Meta direct or via approved BSP)
- ✅ Apple Wallet pass for booking confirmation
- ✅ Google Calendar / iCal export per staff
- ❌ Xero/Quickbooks (v1.5)
- ❌ Mailchimp/Klaviyo (we don't do campaign-blasts; intentional non-feature)

## What's explicitly NOT in v1

Cross-cutting "v1.5 or later" cuts, captured here for marketing-vs-reality discipline:

- Chair-rental (C10) data model, host dashboard, rent automation, dispute mediation.
- Multi-brand (C13) portfolio rollup, brand-wall guarantees.
- Senior-with-admin role at deep R3 (v1 ships at R2; R3 promotion mid-v1.5).
- Cross-shop reporting + chain rollup (no chain customers in v1).
- Voice in any locale other than English-IE.
- Voice in any vertical other than Hair.
- Cross-tenant intelligence panel with real insights (scaffolding only).
- Class-booking (capacity-bound; Fitness vertical).
- Medspa informed-consent workflow.
- Tattoo design-proof workflow.
- White-label / partner portal.
- API for third-party developers.
- Self-serve enterprise SSO (manual provisioning OK for v1).

## Acceptance criteria for v1 ship (additive to launch-plan Gate 3)

Per F8 + F9 + F10 commitments:

1. **All Gate 3 criteria in `docs/launch-plan.md`** (Stripe billing live, App+Play live, ToS+Privacy+DPA published, status page, SOC 2 Type 1 kicked off, €1k MRR pipeline).
2. **All 7 v1 workflows green in eval suite** (per persona × per vertical) — pre-merge eval pass mandatory per ADR 0016.
3. **All 5 v1 features eval-tested across all served personas.**
4. **Audit log hash-chain integrity verified** (ADR 0015 — daily tip-hash signed + published).
5. **Per-tenant runtime cost envelope held** for 30 consecutive days across all live tenants (ADR 0012).
6. **No "Liv was wrong" SEV1 in trailing 7 days** before declaring v1 ship.
7. **All policy docs published + counsel-reviewed** (`docs/legal/*` and customer-facing `docs/policy/*`).
8. **First 10 design partners onboarded + at least one real revenue-generating booking each.**
9. **Phorest broker successful for ≥3 of the 10 partners** (the migration story is real, not theoretical).
10. **Marketing-vs-reality audit (`docs/audits/marketing-vs-reality.md`) has zero rows in `build-before-G3`.**

## v1 → v1.5 graduation criteria

We open v1.5 commitments when:
- v1 has held all SLOs for 60 consecutive days.
- v1 has ≥50 paying tenants (not just design partners).
- The first 10 design partners NPS ≥40.
- The audit log has demonstrated tamper-evidence in a real audit drill.
- The eval framework has ≥1000 production traces in the golden set per served persona.

## Open questions

- Apple Wallet rollout phasing — same-day with v1, or fast-follow?
- Should the v1 release notes be branded as "v1.0" or "Liv (initial release)"? (Brand stewards' call.)
