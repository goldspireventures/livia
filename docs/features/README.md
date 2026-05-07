# Features — F4 inventory

**Status:** F4 (2026-05-07). Index + representative depth on 5 features. ~200+ features remain enumerated for incremental fill — each follows the same template.

## Documentation template (every feature)

- **What it is** (one paragraph).
- **Surfaces it appears on.**
- **Configurations that need it.**
- **Verticals that need it.**
- **Personas that use it.**
- **Modalities supported** (especially: no-app path).
- **Ambition rung it earns or requires.**
- **Dependencies on other features.**
- **Build complexity** (S/M/L/XL).
- **Nested sub-features.**
- **Power-user vs casual UI density.**
- **Accessibility profile.**
- **"In its own league" angle** (differentiation vs Phorest et al.).

## Organisation — by surface

### S1 — Mobile (staff "My Day" + owner cockpit + customer DM-aware app)
- Today view (staff: "My Day"; owner: cockpit) ✅ *(detail file: `mobile-today-view.md`)*
- Push notification system
- Wallet pass updates
- Direct booking entry (mobile-first; no laptop required)
- Voice-note replies to customer DMs
- Cash close on mobile
- (~25 features in S1)

### S2 — Web dashboard
- Multi-staff calendar (Receptionist + Manager view)
- Reports (daily, weekly, monthly, P&L; per-shop and rollup)
- Settings (brand, services, pricing, staff, policies)
- Audit log search ✅ *(detail file: `audit-log-search.md`)*
- AI training review (every Liv decision in the past N days; up/down vote; commentary)
- (~40 features in S2)

### S3 — Public booking page (`livia.io/b/<salon>` + embed)
- Service + staff + slot picker
- Deposit collection
- Intake form (vertical-aware)
- Wallet pass issuance
- Brand customisation
- (~15 features)

### S4 — Email
- Transactional (confirmations, reminders, refunds, receipts)
- Weekly digest
- (~10 features)

### S5 — SMS / WhatsApp
- Bidirectional booking flow ✅ *(detail file: `whatsapp-booking-flow.md`)*
- Reminder cadence
- No-show soft-touch
- Refund confirmation
- Drift re-engagement (consent-gated)
- (~15 features)

### S6 — Voice (Liv answers the phone) ✅ *(detail file: `voice-receptionist.md`)*
- Inbound call answer
- Disclosure-on-first-contact
- Booking via voice
- Escalate-to-human handoff
- Per-tenant voice memory (caller-id → known regular → tone)
- (~10 features)

### S7 — Wallet pass (Apple Wallet + Google Wallet)
- Issuance at first booking
- Real-time updates
- Reminder triggers from pass
- Multi-pass per customer (one per salon)
- (~5 features)

### S8 — Kiosk (front desk tablet)
- Customer self-check-in
- Walk-in queue
- Customer-facing display ("Mary — chair 2 in 5 min")
- (~5 features)

### S9 — Marketing site (`livia.io`)
- Hero + product story
- Per-vertical landing
- Per-configuration landing (chair-rental, multi-brand)
- Pricing page
- /demo gateway (already shipped)
- (~10 features — out of F4 scope; references existing marketing artifact)

## Organisation — by category

### Cat-A — Booking ✅ (covered above)
### Cat-B — Payments
- Deposit collection
- Refund processing (with cap ladder)
- Tip handling (per-staff)
- Subscription/membership billing (fitness)
- Invoice generation
- Tax export (Q-period)

### Cat-C — Scheduling
- Multi-staff calendar
- Rota build/publish
- Shift swap
- Time-off
- Coverage analysis
- Class booking (capacity-bound; fitness)

### Cat-D — Marketing-as-conversation (per Bet 5)
- DM triage with Liv-drafts
- Customer-anniversary detection + gentle outreach (consent)
- Drift re-engagement (consent + Owner toggle)
- Pre-visit nudges
- Post-visit follow-up
- (No campaign-blast. Per Bet 5.)

### Cat-E — AI surfaces
- Briefing voice (per persona, per vertical, per brand-positioning)
- AI training review surface
- Eval surface (admin-only)
- Liv's character bible enforcement (lint-time + run-time)
- Tool-calling registry
- Cross-tenant intelligence (with k≥10 floor) ✅ *(detail file: `cross-tenant-intelligence.md`)*

### Cat-F — Admin
- Invite / revoke seats
- Role + delegation editor
- Audit export
- GDPR data request fulfilment
- Billing
- Business onboarding

### Cat-G — Analytics
- Dashboards (Owner cockpit; per-shop; chain rollup)
- Reports (built-in + downloadable)
- Anomaly detection
- Cohort analysis (CT1→CT2 conversion; CT2→CT6 drift)

### Cat-H — Multi-shop
- Cross-shop dashboard
- Cross-shop staff borrow flow
- Brand consistency check
- Cross-shop customer recognition (with consent)

### Cat-I — Brand
- Brand customisation (logo, colour overlay over Aurora-Midnight, voice tone-knob)
- Multi-brand isolation
- Per-brand wallet pass

### Cat-J — Integrations
- Calendar (Google, Apple, Outlook)
- Payments (Stripe IE, Adyen, PayPal)
- Accounting (Xero, Quickbooks)
- Marketing-list export (only with explicit reason logged)
- Phorest data export broker (one-shot migration)
- Insurance providers (medspa, allied health)

---

## Total: ~200+ features

5 fully detailed in this F4 pass; the rest enumerated above. Each follows the documentation template.
