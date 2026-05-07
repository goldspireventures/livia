# Journey — P2b Owner-no-Mgr × Solo barbershop × Hair

**The cell.** Conor McGee. Single-chair barbershop in Stoneybatter, Dublin 7. One apprentice (Mo, 6mo in). Part-time Saturday receptionist. Currently pen-and-paper + WhatsApp; tried Square once, abandoned.

**Why this journey.** This is the R5 cell — the deepest bet. F7 anchors it. F5 maps the year that gets us there.

## First touch

- A barber friend (Phorest user) mentions Livia in a WhatsApp group: "they answer the phone for you."
- Conor visits `livia.io/for/barbers`. Headline: *"Liv answers the phone. So you can finish the cut."* One-line economics: *"Most barbers we talk to lose €8-15k/yr in missed calls. Liv catches them."*
- He clicks /demo. Spends 7 minutes.
- He books a 20-min concierge call (default for solo single-chair per F9 sales motion).

## Sign-up & onboarding (concierge — 25 min)

- 20-min call with founder-led onboarding (first 100 customers; later moves to onboarding ops lead per F10 hiring plan).
- Liv's voice number provisioned (Twilio per-tenant Irish number, ported from his existing if he wants).
- WhatsApp Business sender verified.
- Calendar imports from his old Google Calendar (CSV-via-broker).
- Top 30 regulars imported from contacts (Conor's WhatsApp, Square export).
- Per-tenant Liv voice tuned in 5 min: register knob (he picks "everyday" — neither luxury nor budget), pace, hand-off rules.
- Day-1 settings: refund cap (€0 for him alone — he's the OWN, no internal ladder); deposit policy (none for regulars, 30% for new); cancellation (24h).

## First day with Liv

- Voice line live by hour 4.
- Within hour 1, Liv answers her first call — a regular checking Saturday availability. Conor watches the transcript live in the dashboard.
- Liv handles 6 calls in the first day; 4 result in bookings (3 regulars, 1 new), 2 are general questions she answered.
- WhatsApp DM flow live by end of day; 2 customer DMs handled.
- Conor's evening surface: Liv's voice-summary of day 1 (text + audio): *"Six calls, four bookings, no missed calls. Mo had 2 walk-ins. Cash so far €245. Tomorrow you have 8 booked."*

**Trust at end of day 1:** R1 → already approaching R2 because Conor has watched 6 voice calls play out correctly.

## First week

- 38 voice calls answered (vs his estimate of "15-20 a day in busy week" — he'd been radically under-counting missed ones). 27 bookings out of 38.
- 12 WhatsApp threads handled.
- Mo's first push notification when his walk-in rebooks — Mo lights up.
- First "Liv was wrong" moment: she booked a regular with Mo without checking that he asks for Conor specifically. Conor flags it; Liv apologises to the regular, rebooks with Conor, surfaces a learning ("Tom Walsh: prefers Conor only" → preference logged).
- Cash close on mobile each evening (~3 min vs his old 30-min Excel).

**Trust at end of week 1:** R2 — Conor approves Liv's auto-confirmation of 5-6 regulars without edit.

## First month

- 165 voice calls; 124 bookings (vs his pre-Liv ~85 estimate); revenue +€2,200 already attributable to recovered missed calls.
- WhatsApp now handles ~70% of customer initiation (was phone-led before).
- First weekly digest delivered Sunday — Conor sits with the audio version while doing dishes; texts founder after: "this is sick."
- Promotion to R3: Liv handles all routine bookings, refunds (rare for Conor — 1 in the month, €15, Liv routed with recommendation, Conor tapped approve), no-shows (3 — recovered 2 from waitlist).
- Mo got 4 first-time rebooks from walk-ins (vs 1 in his prior 6 weeks).

**Trust at end of month 1:** R3.

## First quarter

- Steady state: ~600 calls answered/quarter; ~470 bookings; ~€8,500 incremental revenue.
- Conor has stopped checking the live transcript — reads the daily summary only.
- He raises Liv to R4 for himself: she now proposes plans (e.g. "you've had three Tuesdays under-booked — want me to draft a 10% Tuesday-discount message to your top 30 regulars?"). Conor approves the first plan; second one he edits the wording; third one he says "skip Tuesdays — that's not me."
- First major moment: he takes a Friday off — Mo runs the floor; Liv handles all calls + bookings; Conor checks once at lunch, otherwise unplugged.

**Trust at end of quarter 1:** R4 active for plans; R3 baseline.

## First year

- He hires a second senior barber (configuration graduation — see `configuration-graduation.md`). Now C4 single-shop owner+staff.
- Mo at 12mo qualifies; gets his own service prices; Liv's per-staff stats now relevant.
- Conor takes a real holiday in November — 9 days. Liv runs the shop with the new senior + Mo + Saturday receptionist. Owner-on-holiday workflow active. Liv's daily voice summary goes to Conor; cap-bound refunds queue (none arise above his elevated cap of €100).
- Return digest from Liv: *"Nine days. 178 calls answered, 142 bookings, 0 incidents above your threshold, cash on plan, two minor things waiting your eye."*
- Renewal moment: annual subscription chosen (€X/mo per F9). Conor pays without hesitation.

**Rung at year end:** R5.

## Lifecycle moments designed for in this journey

- **First wrong moment (week 1).** Liv books regular with wrong barber. Recovery flow defined.
- **First scaling moment (month 6 — hire the second barber).** Configuration graduation. Liv's surfaces shift from solo (Owner cockpit only) to owner+staff (cockpit + per-staff scope + push system).
- **First holiday (month 11).** R5 production test.
- **First Christmas push (December year 1).** Calendar overlay applies; Liv's posture for the seasonal surge is encoded in `seasonal-and-stage.md`.
- **First "Liv was wrong" with consequence (month 8).** A regular receives a wrong-time confirmation due to Liv mis-parsing the request. Conor handles personally; Liv learns; eval data point.

## Notes for design

- Mobile-first throughout. No expectation of laptop use except for occasional admin (settings).
- Voice-summary audio variant of every digest — Conor often listens while doing dishes or driving.
- Mo's apprentice surface needs hero empty-states designed alongside; his journey is in `docs/personas.md` (P5).
