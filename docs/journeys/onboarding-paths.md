# Onboarding paths — F5 cross-cutting

Onboarding flows differ per **configuration**, per **vertical**, and per **starting tech sophistication.** Get any of the three wrong and the first 30 days feel like a slog.

## Three onboarding modes

| Mode | When | Time | Cost to deliver |
|---|---|---|---|
| **Self-serve** | Solo (C1, C2) with paper-and-Excel or Calendly background | 30-60 min | ~€0 |
| **Hybrid** | Single-shop owner+staff (C4, C5) | 2 weeks (calls + parallel-run) | ~€500 in concierge time |
| **Concierge** | Single-shop with mgr (C5+), chain (C7+), chair-rental host (C10), multi-brand (C13), or any vertical with regulatory complexity (Medspa, Allied health, Body art) | 2-6 weeks | ~€1500-€5000 in concierge time |

## Configuration-specific paths

### C1-C2 Solo
- Self-serve.
- Day 1: voice number provisioned (10 min); WhatsApp verified; calendar imported (CSV or Google Calendar pull); top 30 contacts imported; Liv-voice tuned in 5 min.
- Day 1 evening: first voice call answered.
- 30-day checkpoint call (free, optional).

### C4 Single-shop owner+staff (no mgr)
- Hybrid.
- 30-min sales call → 60-min onboarding call (Owner only) → 30-min staff intro (group) → 14-day parallel-run if migrating from existing software → cutover.

### C5-C6 Single-shop with mgr (mature)
- Concierge.
- 2-3 hours of conversation across 2 weeks: Owner alone, then Owner + Manager, then full staff intro.
- Refund-cap ladder configured live in the call (the most-impactful early decision).
- ADM-D (senior-w-admin) promotion happens in onboarding for C6 if applicable.
- Phorest data export broker if migrating; 30-day parallel run.

### C7+ Multi-shop chain
- Concierge, founder-led at v1, ops-lead-led at v1.5+.
- 4-6 weeks. Per-shop onboarding sequenced; voice + WhatsApp per shop; cross-shop dashboard live week 1; per-shop cutovers staged.

### C10 Chair-rental
- Concierge — special handling.
- Host onboarding first (the host's surface).
- Each renter onboarded individually; data-isolation explicitly walked through.
- The "you can take your data when you leave" walkthrough is mandatory and visible — renter's trust depends on it.

### C13 Multi-brand
- Concierge with multiple per-brand tracks.
- One Founder-level dashboard; per-brand sub-tenants.
- Brand-isolation explicitly demonstrated (and tested) in onboarding.

## Vertical-specific paths (additions to configuration baseline)

### Hair / Beauty (v1 heartland)
- No additions beyond configuration baseline. The default path.

### Body art (Tattoo)
- Adds: design-proof workflow setup; deposit-binds-design rule configuration; age-verification workflow; healing-aftercare comms cadence configuration.
- Adds 2-4 hours of concierge time.

### Medspa (v3)
- Adds: informed-consent workflow setup; contraindication checklist per service; before/after photo handling configuration; complications protocol routing.
- **Mandatory regulatory walkthrough.** Concierge includes a partner-network referral for insurance + medico-legal review.
- Adds 6-10 hours.

### Allied health (v3 lite)
- Adds: progress-notes workflow; treatment-plan adherence; GP referral handoff configuration.
- Adds 4-6 hours.

### Fitness (v2)
- Adds: class-booking workflow (capacity-bound, recurring); membership consumption tracking; PARQ intake setup.
- Adds 4-6 hours.

## Starting-tech-sophistication paths

### Paper-and-Excel
- Most demanding. Customer migration is manual or limited (only what's in contacts).
- Strategy: don't try to migrate full history; start clean from day 1; build the data over the first quarter.
- Onboarding: extra reassurance about what they'll lose vs gain; explicit "we don't need your old data to be valuable to you on day 1."

### WhatsApp + Calendly + spreadsheets
- Common in solo (C1, C2).
- WhatsApp continuity is a sales advantage — same number, smarter recipient.
- Calendly events imported as historical bookings; future bookings transitioned.

### Already on Phorest
- Most common in v1 heartland.
- **Phorest data export broker** is the migration tool. Pulls customer + booking history; reconciles into Livia schema.
- 30-day parallel run mandatory — both systems writing; cutover only after reconciliation.
- Phorest stays read-only for 90 days post-cutover (free, for owner reference).

### Already on Fresha
- Less common in IE; more in EU-mainland.
- Similar broker; less mature than Phorest broker at v1.

### Already on Booksy / Square / Vagaro / Acuity
- Each has its own broker. Vagaro and Acuity are simplest (CSV-style export).
- Square has a richer API; richer broker.

## What we never compromise on in onboarding

1. **EU residency from day 1.** No interim US-routed phase.
2. **Data ownership clarity.** Owners (and chair-rental renters) sign off on what's theirs, what's the salon's, what's Livia's.
3. **The cap-ladder lives by day 1.** Even if the salon doesn't use it day 1, the ladder is configured and visible.
4. **Liv's voice character is tuned in onboarding.** Not left to defaults.
5. **The kill-switch is shown.** Owners see how to pause Liv, demote rung, or terminate the relationship before they sign.

## Out of scope

- Marketing-list import / re-engagement on day 1 — that's a Bet 5 violation if done at scale. Owner can opt in selectively post-30-days.
- Brand redesign as part of onboarding — Aurora-Midnight inherits; per-brand customisation happens incrementally.
- Cross-tenant intelligence opt-in — explained in onboarding but enabled only after 30 days (give the tenant time to understand what they're opting into).
