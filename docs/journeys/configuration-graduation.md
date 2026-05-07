# Configuration graduation — F5 cross-cutting

Salons change shape. Solo becomes single-shop; single-shop becomes chain; partnership splits or buys out; chain franchises. Each transition has data, billing, permissions, and team implications. If Livia handles graduation gracefully, owners stay through their growth. If clumsily, they leave at exactly the moment they were ready to deepen the relationship.

## The 6 graduations Livia must handle

### G1 — Solo → Single-shop with first hire (C2/C3 → C4)

**Trigger.** Owner adds first staff member.
**Data.** Existing customer + booking + financial data unchanged. Add `staff_user_id` to historical-data attribution where ambiguous (Owner did all the cuts) — leave attributed to Owner.
**Permissions.** New STA membership row; reports_to = OWN (no ADM yet). STA gets "My Day" mobile.
**Liv's posture.** Adds the staff-side "My Day" surface. Reduces some Owner-side surfaces (Owner stops seeing Junior-only walk-ins on her cockpit). Keeps the cap-ladder simple (no ADM yet — OWN approves all).
**Workflow surfaces.** B-workflows now active.
**Billing.** Per F9 packaging, may move from solo tier to staff-tier (typically per-active-staff component).
**Onboarding.** Light — 30-min call to set the new STA up + brief team chat for Liv-character intro.

### G2 — Single-shop owner+staff → with first Manager (C4 → C5)

**Trigger.** Owner promotes a Senior to Manager (or hires one).
**Data.** Unchanged.
**Permissions.** New ADM membership row; reports_to of all STAFF updated to ADM; Owner remains OWN.
**Liv's posture.** This is a significant rung-shift for the Owner — many move from R3 (Liv handled most ops) to R2 (Manager now handles ops; Liv supports Manager). Counter-intuitive demotion, but right.
**Workflow surfaces.** C-workflows now relevant. Cap-ladder gains the ADM tier.
**Billing.** Adds Manager-tier features (multi-staff calendar, rota build/publish, daily cashout).
**Onboarding.** Hybrid — 60-90 min Owner+Manager session to redistribute the cap-ladder + delegations.

### G3 — Single-shop → Multi-shop chain (C5/C6 → C7)

**Trigger.** Owner opens a second location.
**Data.** New tenant for the second shop. Owner gets OWN membership at both. Customer data does NOT auto-share between shops (privacy default + the customer's own preference).
**Permissions.** Per-shop permissioning; Founder identity layer activates.
**Liv's posture.** Founder cockpit comes online; per-shop briefings continue. Cross-shop comparisons available.
**Workflow surfaces.** H-workflows (cross-shop) activate.
**Billing.** Per-shop billing; per-Founder identity.
**Onboarding.** Concierge for the second shop launch — replicates the C5 onboarding pattern with chain-specific additions.

### G4 — Multi-shop chain → Larger chain (C7 → C8 → C9)

**Trigger.** Adding more shops.
**Data.** Linear addition.
**Permissions.** May add OPS-Director-equivalent (modelled as ADM with chain-scope delegations from each shop's OWN — F3 §6).
**Liv's posture.** Chain-rollup digest becomes more important than per-shop digest for Founder. Per-shop ADM continues at R3.
**Workflow surfaces.** No new categories; existing H-workflows scale.
**Billing.** Volume tier kicks in per F9 pricing.
**Onboarding.** Concierge per new shop; founder-led at v1, ops-lead at v2.

### G5 — Single-shop → Chair-rental host (or vice versa) (C5/C6 ↔ C10)

**Trigger.** Owner converts employees to chair-renters (or vice versa).
**Data.** Significant restructuring. Per-staff customer ownership: who owns what?
**Permissions.** Renters become OWN of their own one-person tenants; STA membership at host's tenant changes scope.
**Liv's posture.** Host-side surface narrows (host loses visibility into renter's customers). Renter-side surface broadens (Renter gets full Owner cockpit for her one-person tenant).
**Workflow surfaces.** I01 chair-rental specific activates (rent collection, chair-availability, etc.).
**Billing.** Different pricing model (host pays for floor + reception; renter pays per-tenant).
**Onboarding.** **Concierge mandatory.** This is the most delicate graduation. Each renter's data ownership has to be explicitly walked through with them. Customer data: agreement on which customers travel with which renter (typically: a customer has a primary stylist; the customer travels with the stylist if they leave, with consent).

### G6 — Single-business → Multi-brand portfolio (any → +C13)

**Trigger.** Founder opens a new brand alongside existing.
**Data.** New tenant per brand. Strict customer-isolation by default. Cross-brand customer linking requires both Owners' approval AND customer's own consent.
**Permissions.** Founder gets OWN at each brand.
**Liv's posture.** Brand-portfolio dashboard. Brand-isolation enforced at every surface.
**Workflow surfaces.** I04 multi-brand-specific activates.
**Billing.** Per-brand subscription; multi-brand discount per F9 pricing.
**Onboarding.** Concierge — emphasis on isolation walkthrough.

### G7 — Partnership → split (one partner buys out, partnership dissolves) (C12 → C5/C6)

**Trigger.** Partnership ends.
**Data.** Tenant continues with surviving partner as sole OWN. Departing partner's data: per partnership agreement (often partner-specific customer data follows them; shared shop data stays).
**Permissions.** Departing partner's OWN membership revoked; surviving partner's authority unchanged.
**Liv's posture.** Briefing-voice may shift slightly (no longer "your team" — now "your sole oversight"). Audit log preserves the transition.
**Workflow surfaces.** Standard C5/C6 going forward.
**Billing.** Partnership tier reverts to standard.
**Onboarding.** Concierge — handled with extra sensitivity (can be a difficult human moment).

## The migration mechanics

For each graduation, Liv's migration tooling must:

1. **Preserve audit-log continuity.** A graduation is a logged event (`tenant.configuration_changed`). Before/after states recorded.
2. **Preserve customer trust.** Customers see no surface change unless explicitly part of the graduation (e.g. chair-rental renter's customer is told the renter is leaving).
3. **Preserve staff dignity.** A demoted role (e.g. Manager loses authority during partnership dissolution) is handled with explicit human conversation; Liv supports but doesn't deliver.
4. **Preserve OWN authority.** OWN approves every graduation; Liv never initiates.
5. **Preserve rollback.** A graduation is reversible within 30 days for misclick-protection; after 30 days, requires explicit OWN+support intervention.

## What graduation reveals

Each graduation is a moment where the Owner's relationship with Liv is renegotiated. Some Owners promote Liv during graduation (G3 chain-Founder typically promotes Liv to R4 by month 3 because the cognitive load demands it). Some demote her (G2 first-Manager often demotes Owner-side Liv from R3 → R2 because the Manager is now the primary operator; correctly).

Graduation is **the second-most-common moment for Liv to be re-evaluated** (after the weekly digest). Designed well, it's where customer love deepens.
