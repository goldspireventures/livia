# v2 scope — verticals + UK + Nordics open

**Status:** Lock-soft (2026-05-07). Target ship: 2027 H2 → 2028 H1. Acceptance: v1.5 → v2 graduation criteria in `v1.5-scope.md` + the additions below.

## v2 promise (one sentence)

Livia opens to **Body art**, **Fitness**, and **Wellness** verticals, **UK at scale**, and the **first Nordic markets** (Sweden + Denmark first), with class-booking, tattoo design-proof workflow, mid-chain (C8) support, and the first non-English voice locales.

## What's added in v2

### Verticals added
- **Body art** (tattoo, piercing) — distinct workflows: tattoo design-proof, healing-followup, piercing aftercare reminders, allergy intake, parental-consent flows.
- **Fitness** (yoga studio, pilates, CrossFit, boutique gym) — class-booking with capacity, waitlists, package-credit accounting, no-show charging.
- **Wellness** (massage, holistic therapy, alternative wellness) — closer to Hair model but with intake forms and longer appointments.

### Configurations deepened
- **C8 Mid multi-shop (5–9 shops)** — chain operations team support; per-shop manager + chain-level Founder; cross-shop staff promotion; chain-level brand voice consistency.
- **C11 Franchise** — first-class franchise data model; franchisor-franchisee scope split; royalty calculation + reporting; brand-mandated workflows.
- **C12 Partnership** — partner-vote workflow at full depth (graduated from v1.5 scaffolding).

### Locales added
- **English-UK voice** (continued; deeper).
- **Swedish** (text + voice).
- **Danish** (text + voice).
- **Norwegian** (text + voice).
- **Finnish** (text first; voice deferred — Finnish TTS quality assessment pending).

Per-locale Liv character lead + golden corpus + eval set per ADR 0016 + brand-of-Liv localisation (per `docs/business/geographic-expansion.md`).

### Workflows added
- `class-booking` — capacity-bound; waitlists; package credits; cancellation policies per studio.
- `tattoo-design-proof` — design draft → customer review → approve/revise → deposit → session.
- `healing-followup` — automated check-in DMs at 24h/7d/30d post-procedure for body art.
- `intake-form-medical` — pre-appointment medical/allergy intake (used by Body art, Wellness, eventually Medspa).
- `package-credit-accounting` — multi-session packages with credit ledger.
- `franchise-royalty-rollup` — automated franchisee-to-franchisor reporting.
- `brand-mandated-promotion` — franchisor-driven promotion cascade with franchisee opt-out window.
- `mid-chain-staff-promote` — promotion flow across shops with cap-graduation.

### Features added
- **`class-roster-view`** — per-class roster with check-in.
- **`tattoo-portfolio-attach`** — design-proof images attached to booking.
- **`package-credit-display`** — customer-facing credit balance.
- **`franchise-rollup-dashboard`** — franchisor-side aggregate.
- **`per-locale-voice-cast-management`** — internal tool for Liv voice updates per locale.

### Markets opened
- **UK (nationwide).**
- **Sweden** (Stockholm primary).
- **Denmark** (Copenhagen primary).
- **Norway** (Oslo primary).
- **Finland** (Helsinki — text-first; voice when ready).

### Pricing changes
- v1.5 tiers continue; per-locale pricing parity (no premium for non-IE markets).
- Per-vertical add-ons:
  - Body art: +€20/mo (tattoo design-proof + healing followup).
  - Fitness: +€30/mo (class-booking + capacity + waitlist).
- Cross-tenant intelligence add-on continues at €49/mo with locale-specific peer-sets.

### Migration tooling added
- ✅ Vagaro broker (US-rooted single-shop competitor; UK presence).
- ✅ Acuity broker (generic; long tail).
- ✅ Timely broker (AU/NZ/UK).
- ✅ Mindbody CSV importer (Fitness).
- ✅ Studio-specific importers (e.g., MINDBODY classes; Glofox class data).

### Integrations added
- ✅ Klarna / Trustly for Nordics payments (where Stripe insufficient).
- ✅ DocuSign / equivalent for body art consent forms.
- ✅ Class-pass equivalent (where partnership viable; not core).
- ⚠️ Public API alpha (read-only; design-partner-only).

## What's still NOT in v2

Pushed to v3:
- Medspa informed-consent (regulatory complexity; v3).
- Allied health adjacency (dental hygienist, physio, mental health adjacent).
- DACH (Germany/Austria/Switzerland) — v3.
- France — v3.
- Iberia — v3.
- Public API (general availability).
- White-label / partner portal at full depth.
- Enterprise self-serve SSO.
- BYOK encryption for tenants.

## Acceptance criteria for v2 ship

1. v1.5 acceptance continues to hold.
2. Each new vertical (Body art, Fitness, Wellness) has ≥5 paying tenants operating for 30 days.
3. Each new locale (UK, SE, DK, NO, FI text) has ≥3 paying tenants operating for 30 days; voice locales have eval pass at v1-equivalent quality.
4. Liv character maintained across all new locales (brand-of-Livia voice review per locale).
5. Class-booking validated with ≥3 Fitness studios across multiple class types.
6. Tattoo design-proof validated with ≥3 Body art studios.
7. Eval suite expanded per new persona × vertical × locale.

## v2 → v3 graduation criteria

- v2 holds SLOs for 90 days.
- ≥1,000 paying tenants total.
- ≥3 markets at meaningful scale (≥100 tenants each).
- Cross-tenant intelligence covers ≥6 peer-set categories with k≥30 each.
- Eval-pass rate ≥98% across all served personas/cells.
- Founder + leadership team sign v3 RFC.

## Open questions

- Class-booking + 1:1-booking unification — single calendar surface or distinct? (Currently leaning unified with mode-toggle.)
- Body art consent forms vs Medspa informed-consent — unify the framework or separate? (Leaning unify; Medspa adds regulatory layer.)
