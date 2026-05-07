# Lifecycle moments — F5 cross-cutting

Universal moments that recur in every cell, regardless of configuration or vertical. Designed once; surface contextually.

## L1 — Customer anniversary

**The moment.** A customer crosses an anniversary milestone (1 year, 5 years, 10 years) of regular custom.
**Liv's posture.** Surfaces to OWN/relevant staff member privately ("Mary's 8th year coming up Tuesday"); does NOT auto-message the customer (would feel transactional).
**Staff response.** A handwritten card from the staff member, a brief mention at the visit, a no-pressure thank-you.
**Brand stance.** Quiet recognition. Never a "5-YEAR LOYALTY DISCOUNT" coupon — that's the cheap version.

## L2 — Milestone bookings

**The moment.** A customer hits 10/50/100 bookings; a stylist hits 1000 cuts; a shop hits its annual booking record.
**Liv's posture.** Surfaces to relevant party in the digest.
**Brand stance.** Internal celebrations are encouraged. Customer-facing celebrations are discouraged unless the customer would naturally want it (e.g. a customer who explicitly tracks their own visits).

## L3 — Staff promotion

**The moment.** A Junior becomes Senior; a Senior becomes Senior-with-admin; a Senior becomes Manager.
**Liv's posture.** Workflow C09 (promote-flow) handles the mechanics. Liv adjusts her register toward the staff member to match new authority. Audit log entry.
**Brand stance.** Internal-team announcement (configurable; default OWN approves wording). External-customer announcement only if customer-relevant (e.g. "Mary's stylist Lara is now also our Colour Director — your Tuesday slots remain unchanged with her").

## L4 — Customer's first VIP-status promotion (CT2 → CT3)

**The moment.** A regular crosses the threshold for VIP classification.
**Liv's posture.** Surfaces to OWN ("Mary is now in the top 10% by spend"). Does NOT surface to customer.
**Staff response.** Internal-only awareness; behaviour shifts (priority slot offers; small gestures — see CT3 in `customer-typologies.md`).
**Brand stance.** Quiet. Some brands want a wallet-pass marker; many don't. Owner-controlled.

## L5 — Year-end wrap-up

**The moment.** End of calendar year (or end of fiscal if different).
**Liv's posture.** A year-in-review digest goes to OWN: numbers vs prior year, top decisions of the year, top improvements year-over-year, suggestions for the next year.
**Staff-side.** Each STAFF gets their own year wrap (their bookings, their growth, optional public-team-recognition).
**Customer-side.** **Optional** — Spotify-Wrapped style year-in-cuts is divisive; default OFF; some brands turn it on per customer opt-in.

## L6 — Christmas push

**The moment.** December surge — calendar overlay applies (see `seasonal-and-stage.md`).
**Liv's posture.** Anticipates capacity; nudges Owner to consider extended hours, additional shifts, deposit-firmness for new bookings (no-show risk highest in December).
**Staff response.** All-hands week.
**Customer-side.** Reminders earlier; gift-card friendliness; spa-day group bookings flagged.

## L7 — January slump (or January fitness surge for fitness vertical)

**The moment.** Hair/Beauty: January is typically slow; Fitness: January is the peak.
**Liv's posture.** For Hair/Beauty: gentle re-engagement options (Owner-controlled), focus on rebooks of December walk-ins, 1-on-1-prep digests for slower weeks. For Fitness: capacity management; class-waitlist management; new-member onboarding sprints.
**Staff response.** Different per vertical.

## L8 — Summer holiday season

**The moment.** July-August in IE/UK is reduced staff (everyone's on holiday in turn) and reduced customer demand (customers also away).
**Liv's posture.** Time-off coordination becomes denser; rota-balancing harder. Liv flags overlapping holiday requests early.
**Customer-side.** Pre-summer rebooking nudges (so Christmas-season slots get pre-claimed).

## L9 — Wedding season (March-September urban; April-October regional)

**The moment.** Wedding-related bookings spike (bridal hair/makeup; wedding-party group bookings).
**Liv's posture.** Forward-booking deeper than usual (3-6 months out). Group-booking workflows emphasised. Confirmation cadences denser.
**Vertical inflection.** Hair, Beauty, Wellness (spa-day) primary.

## L10 — Owner's first holiday (after R5 reached)

**The moment.** **The single most-cited trust signal in Livia.** Owner takes their first real holiday since adopting Liv.
**Liv's posture.** Owner-on-holiday workflow (E03) active. Daily voice/text summary to OWN; cap-bound items handled by delegate; OWN-only items queued.
**Recovery.** Return digest summarises the window.
**Brand stance.** This is the moment we win or lose. Designed with full attention.

## L11 — First customer who tried Liv at another salon

**The moment.** A customer arrives at Aurora who has been using Liv at another salon (CT5 Multi-salon). They mention it.
**Liv's posture.** Recognises (per CT5 detection); does NOT cross-reference unless customer explicitly consents at this salon.
**Staff response.** Treat as standard New customer (CT1) for first visit; the cross-tenant identity is the customer's to bring up.

## L12 — First customer-facing API request (when Livia opens dev surface — v3)

**The moment.** A customer asks "can I get my data?" — GDPR-flavoured request.
**Liv's posture.** G03 GDPR data request workflow. Self-service surface (customer's own data, downloadable). 30-day fulfilment SLA.

## Cross-cutting design principles

- **Liv surfaces. Humans act.** Lifecycle moments are surfaced to humans, not auto-actioned.
- **Default to quiet recognition.** External celebration is the exception, not the default.
- **Per-tenant control.** Every lifecycle moment is configurable per tenant — some brands want them on, some off.
- **Never break character.** A celebration in Liv's voice should feel like a colleague noting it warmly, never like a marketing email.
