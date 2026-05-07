# Customer typology skeleton — F1

**Status:** F1 (2026-05-07). F3 promotes this into a deep spine doc (`docs/customer-typologies.md`).

The customer is not a single persona. Six archetypes recur across every populated cell and shape Liv's posture toward them.

---

## CT1 — New customer

**Definition.** First interaction with the salon. No history.

**Detection signal.** No row in `customers` for this contact, OR `bookings_count = 0`.

**Liv's posture.** Concierge-soft; introduces the salon's policies (deposit, cancellation, intake form); volunteers nothing personal she can't yet know; handles awkward firsts (consent, age check, allergy patch test) with extra warmth.

**Universal across verticals?** Yes.

**Vertical inflection.** New medspa customer triggers heavier intake (medical history, contraindications, photo consent). New tattoo customer triggers age-verification and design-proof workflow. New hair customer is light.

**Configuration inflection.** None significant.

---

## CT2 — Regular customer

**Definition.** 3+ bookings in the last 12 months. Stable cadence.

**Detection signal.** `bookings_count >= 3 AND days_since_last <= 90`.

**Liv's posture.** Colleague-warm; assumes prior knowledge; uses first name; references usual stylist/service; doesn't re-explain policies.

**Universal across verticals?** Yes.

**Configuration inflection.** **Chair-rental:** the regular belongs to the *stylist*, not the host shop — Liv addresses them with "your regular stylist Niamh" framing, never moves them to another stylist without explicit consent. **Multi-brand:** regular at "Aurora Studio" is NOT exposed at "Aurora Mews" without explicit cross-brand consent.

---

## CT3 — VIP customer

**Definition.** Top decile by spend, or named-VIP by Owner, or visit-frequency in the top 5%.

**Detection signal.** `(spend_ytd >= top_10_percentile_threshold) OR (owner_marked_vip = true) OR (visit_frequency_ytd >= top_5_percentile)`.

**Liv's posture.** Concierge-deluxe; offers prime slots first; never makes them wait on hold; pre-empts deposit collection so they're never asked at the desk; remembers the small things ("you usually take a flat white when you arrive — I've let the team know"). Special handling for crisis days (slot held even when fully booked, with the Owner notified).

**Universal across verticals?** Yes.

**Vertical inflection.** Medspa VIPs trigger pre-treatment outreach 24h prior; tattoo VIPs get studio-priority for booking-window-opens.

**Configuration inflection.** **Chain:** VIP belongs to the brand (visible at all shops). **Chair-rental:** VIP belongs to the stylist.

---

## CT4 — Refund-prone customer

**Definition.** ≥ 2 refund requests in the last 12 months, regardless of cause.

**Detection signal.** `refund_requests_12mo >= 2`.

**Liv's posture.** Steel-soft warmth — handles refund call without defensiveness, but escalates anything above the per-rung cap to the Owner without exception. Does NOT mention the pattern to the customer (would damage trust). Surfaces the pattern in Owner's weekly digest.

**Universal across verticals?** Yes.

**Vertical inflection.** **Medspa refund-prone is medico-legally distinct** — pattern may indicate procedure dissatisfaction with regulatory implications; Liv escalates to Owner with extra context, never autonomously refunds even within cap.

---

## CT5 — Multi-salon customer

**Definition.** Customer has interactions at ≥ 2 Liv-using salons (cross-tenant — only after explicit consent on each salon, per F7 Bet 8 reconciliation).

**Detection signal.** `customer_identity_has_consent_at_count >= 2`.

**Liv's posture.** Treats each salon as separate interaction; **never** leaks information about one salon to another in conversation. Allowed: noticing patterns *for the customer's own benefit* (e.g., "you mentioned a wax appointment elsewhere this week — would you like me to time your colour to fit around it?") only with explicit per-salon consent.

**Universal across verticals?** Yes (most relevant in beauty + wellness).

**Configuration inflection.** **Multi-brand:** if one Founder owns both salons, the same data-isolation rule applies — multi-brand cross-pollination requires customer consent.

---

## CT6 — Drifted customer

**Definition.** Was a regular; hasn't booked in N months. N is vertical-specific (Hair: 90 days; Beauty: 60 days; Medspa: 180 days; Body art: 365 days; Fitness membership: 30 days no class attendance).

**Detection signal.** `was_regular = true AND days_since_last_booking >= vertical_threshold`.

**Liv's posture.** Re-engagement outreach is **owner-controlled toggle (default OFF).** Some Owners want it; many find it tacky. When ON: gentle, low-frequency, easy-to-unsubscribe. Never desperate. Liv proposes the message; Owner approves the cadence.

**Universal across verticals?** Yes.

**Configuration inflection.** **Chair-rental:** drift outreach goes from the *stylist's* identity, not the host shop's.

---

## Cross-axis: which typologies appear meaningfully in which verticals/configurations

| Typology | Hair/Beauty | Wellness | Body art | Fitness | Medspa | Allied health | Pet grooming |
|---|---|---|---|---|---|---|---|
| New | very common | common | common | common | common | common | common |
| Regular | very common | uncommon | rare (long cycles) | very common | common | common (clinical) | common |
| VIP | common | common | common | common | very common | rare | rare |
| Refund-prone | common | uncommon | rare | rare (membership-led) | **medico-legally distinct** | rare | rare |
| Multi-salon | common (esp. lash/wax) | common | rare | uncommon | common | rare | rare |
| Drifted | very common | common | common (long-cycle, soft drift) | very common (membership lapse) | common | uncommon (clinical recall is different) | common |

---

## Open questions for F3

- **Cross-tenant identity model**: One Liv-wide customer identity vs per-salon identity? F1 recommends **per-salon by default with explicit cross-tenant linking on customer consent at each new salon.** F3 commits.
- **Customer-who-is-also-a-staff-member privacy**: A junior STAFF whose colleague is her customer at another salon's location — strict privacy boundary. F3 specifies.
- **GDPR special categories**: Health data (allergies, contraindications) is special-category. Storage and transmission require additional safeguards. F3 + `docs/business/regulatory-and-legal.md` cover.
- **Detection-signal ML thresholds**: at v1 use rule-based signals (above). v2 may introduce ML refinements with explainability requirements per EU AI Act.
