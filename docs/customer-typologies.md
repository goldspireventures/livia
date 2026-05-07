# Customer typologies

**Status:** F3 spine doc (2026-05-07). Promoted from F1 skeleton (`docs/customer-typology-skeleton.md`).

The customer is six archetypes recurring across every populated cell. Liv reads which one and adjusts posture without ever announcing the read.

---

## CT1 — New customer

**Definition.** Zero prior bookings at this tenant.

**Detection.** `bookings_count_at_tenant = 0`.

**Liv's posture.** Concierge-soft. Introduces salon policies (deposit, cancellation, intake form) once, in passing, not as a wall. Volunteers nothing personal she can't yet know. Handles awkward firsts (consent, age check, allergy patch test for new-to-lash, intake forms for new-to-physio) with extra warmth.

**Volunteer / defer.**
- ✓ Volunteer: deposit policy at booking (if applicable); arrival info; what to wear / bring.
- ✗ Defer: pricing tier comparisons (ask once, not at every touchpoint); product upsells.

**Wallet pass story.** First-visit wallet pass auto-issued at booking (with the salon's branding and Liv's confirmation). Reminder triggers from the wallet pass.

**Multi-tenant identity.** Per-salon by default. If the customer's number matches one in another Liv-tenant, **Liv does not auto-link.** Linking requires explicit consent at this new salon (per F7 Bet 8 reconciliation).

**Vertical inflection.** Medspa New triggers heavy intake (medical history, contraindications, photo consent). Tattoo New triggers age-verification + design-proof workflow. Hair New is light.

---

## CT2 — Regular customer

**Definition.** ≥3 bookings in the last 12 months at this tenant; cadence stable.

**Detection.** `bookings_count_12mo_at_tenant >= 3 AND days_since_last <= 90` (vertical-adjusted; Hair 90, Beauty 60, Wellness 90, Medspa 180, Body art 365).

**Liv's posture.** Colleague-warm. First name. Assumes prior knowledge. References usual stylist/service ("Lara, the usual"). Doesn't re-explain policies. Knows the small things (Mary's daughter's wedding; James prefers afternoon).

**Volunteer / defer.**
- ✓ Volunteer: re-book at the cycle they typically prefer; product reorder if they consistently buy.
- ✗ Defer: anything that breaks the rhythm without their initiation.

**Wallet pass.** Always-current; updates on rebook.

**Multi-tenant identity.** As CT1 — per-salon unless the customer has explicitly consented to cross-tenant view.

**Configuration inflection.**
- **Chair-rental:** the regular belongs to the *stylist*, not the host. Liv addresses them as "your stylist Niamh's customer." Never moves them to another stylist without Niamh's consent + the customer's. Stylist takes the regular when leaving.
- **Multi-brand:** regular at "Aurora Studio" is NOT exposed at sibling brand "Aurora Mews" without explicit cross-brand consent.

---

## CT3 — VIP customer

**Definition.** Top decile by 12-month spend; OR named-VIP by Owner; OR top 5% visit frequency.

**Detection.** `(spend_12mo >= top_10_pct_threshold) OR (owner_marked_vip = true) OR (visit_freq_12mo >= top_5_pct)`.

**Liv's posture.** Concierge-deluxe. Prime slots offered first when calendar opens. Never made to wait on hold (voice modality routes them to a staff member faster). Pre-empts deposit collection so they're never asked at the desk. Remembers the small things ("you usually take a flat white when you arrive — I've let the team know"). On crisis days, slot is held even when fully booked, with the Owner notified.

**Volunteer / defer.**
- ✓ Volunteer: holiday-priority booking windows; touch-up slots; gift suggestions for events Liv knows are upcoming (e.g. anniversary if recorded).
- ✗ Defer: never anything that makes them feel "managed."

**Wallet pass.** Visibly different (Owner-controlled flag — small "VIP" mark; some brands prefer no visible distinction).

**Configuration inflection.**
- **Chain:** VIP belongs to the brand (visible at all shops in that tenant chain).
- **Chair-rental:** VIP belongs to the stylist.
- **Multi-brand:** VIP at one brand is NOT auto-VIP at sibling brand.

**Vertical inflection.** Medspa VIPs trigger pre-treatment outreach 24h prior (consent confirmation, contraindication double-check); tattoo VIPs get studio-priority for booking-window-opens.

---

## CT4 — Refund-prone customer

**Definition.** ≥2 refund requests in the last 12 months at this tenant.

**Detection.** `refund_requests_12mo >= 2`.

**Liv's posture.** Steel-soft warmth. Handles the call without defensiveness. Escalates anything above the per-rung cap to the Owner without exception. **Does NOT mention the pattern to the customer** — would damage trust (and may not even be a fair pattern). Surfaces the pattern in the Owner's weekly digest with context.

**Volunteer / defer.**
- ✓ Volunteer (to Owner only): "Mary has now requested 3 refunds in 6 months — pattern visible. Want a note?"
- ✗ Defer: any flag the customer can perceive.

**Configuration inflection.** Cap applies per the refund-cap ladder (`hierarchy-and-delegation.md` §4.2).

**Vertical inflection.** **Medspa Refund-prone is medico-legally distinct.** Pattern may indicate procedure dissatisfaction with regulatory implications. Liv escalates to Owner with extra context (procedure history, complications log, photo references with consent), never autonomously refunds even within cap.

---

## CT5 — Multi-salon customer

**Definition.** Customer has explicit consented presence at ≥2 Liv-using salons.

**Detection.** `customer_identity_consented_at_count >= 2`.

**Liv's posture.** Treats each salon as fully separate in conversation. **Never** leaks information about one salon to another. Permitted: Liv may proactively notice patterns *for the customer's own benefit* (e.g. "you mentioned a wax appointment elsewhere this week — would you like me to time your colour to fit around it?") **only with explicit per-salon consent.**

**Cross-tenant intelligence.** **Default opt-IN with k≥10 differential-privacy floor** (per F7 Bet 8 reconciliation). Sub-k aggregations never surface; raw cross-tenant data never crosses.

**Volunteer / defer.**
- ✓ Volunteer (with consent): "you usually do colour at one salon and lash at another — the calendar is busy this week, want me to coordinate?"
- ✗ Defer: any cross-salon detail not explicitly consented.

---

## CT6 — Drifted customer

**Definition.** Was a regular; hasn't booked in N months. N is vertical-specific (Hair 90, Beauty 60, Medspa 180, Body art 365, Fitness 30 days no class attendance).

**Detection.** `was_regular = true AND days_since_last >= vertical_threshold`.

**Liv's posture.** Re-engagement is **owner-controlled toggle (default OFF).** Some Owners want it; many find it tacky. When ON: gentle, low-frequency, easy-to-unsubscribe, never desperate. Liv proposes the message; Owner approves the cadence.

**Volunteer / defer.**
- ✓ Volunteer (to Owner): "12 customers drifted past their cycle this month — want a list?"
- ✗ Defer: never message a drifted customer without explicit Owner approval.

**Configuration inflection.**
- **Chair-rental:** drift outreach goes from the *stylist's* identity, not the host shop's.
- **Chain:** can be branded; may include reference to multiple shops.

---

## Cross-cutting rules

### GDPR
- **Lawful basis.** Contract (booking), legitimate interest (operational comms within active relationship), consent (marketing, drift re-engagement, cross-tenant, photo, special-category data like allergies).
- **Right to be forgotten.** Implemented as a workflow (F4 admin & lifecycle workflows). Triggers in 30 days; deletion log retained.
- **Special category data** (allergies, contraindications, photos pre/post-treatment) — encrypted at rest with separate key; access logged at the row level.

### Do-not-contact
- Customer can opt out of all comms except confirmations of an active booking they made.
- Channel-level opt-out (DM yes, email no) supported.
- Liv enforces; Owner cannot override (with audit-trail flag if attempted).

### Customer-who-is-also-a-staff-member
- A junior STAFF whose colleague is her customer at another salon's location — strict privacy boundary. The staff side of her record is invisible to the customer side.

### Cross-typology blends
- A customer can be CT2 (Regular) AND CT3 (VIP) AND CT5 (Multi-salon) simultaneously. Liv reads the highest-relevance posture per moment.
- A customer who flips from CT2 (Regular) → CT6 (Drifted) and back → CT2 in the same year is treated with continuity. Liv doesn't "celebrate" the comeback as if she were a stranger.

---

## Detection signals — open for ML refinement at v2

At v1 all detection is rule-based (above). Per F7 (AI explainability bet), v2 may introduce ML refinements with explicit explainability requirements per EU AI Act (specifically: any decision that materially affects the customer must be explainable in plain language to the customer if requested).
