# Personas v2

**Status:** F3 spine doc (2026-05-07). Replaces v1.

The hotel principle is the design substrate. Same building, different sets of keys. Surfaces, language, defaults, alerts, and authorities differ by persona — enforced at the data-access layer, not the UI.

---

## 0. The hierarchy

Eight roles inside the salon plus one outside. Per ADR 0009.

```
P1 Founder (multi-business OWNER)
    └─ at each business: P2a Owner-with-Mgr  OR  P2b Owner-no-Mgr  (single-business OWNER)
        └─ optional: P3 Manager (ADM)
            └─ optional: P4b Senior-with-admin (STA + delegations row)
                └─ P4a Senior STAFF (STA)
                    └─ P5 Junior STAFF (STA)
            └─ P6 Receptionist (REC)

P7 Customer (outside the org; per `customer-typologies.md`)
```

Customer-typology axis is six archetypes (CT1-CT6) sitting outside the hierarchy. See `customer-typologies.md`.

---

## P1 — The Founder

**Real-world example.** Aoife Kelly. Three Aurora salons (Dublin centre, Dublin south, Galway). 60 staff total. Sunday-evening triage; on the road most weekdays.

**What she really needs to know.** *(in Liv's morning briefing voice)*
> *Galway colour revenue is down 18% week-on-week. New colourist quit Friday; Niamh's been covering. Two managers' cash totals match exactly to the till for the week. Dublin centre's Senior is on the third sick day this month. I've drafted three things — coffee while you read?*

**Tuesday (from F2 walks).** [INFERRED]
- 07:30 daily briefing on phone over coffee (3 numbers per shop)
- 09:00 drive to Galway, call Niamh on the way
- 11:30 onsite, walk floor, approve queued €140 refund
- 13:30 drive back, transit-texts (regular complaint, supplier, accountant)
- 17:00 home with laptop, week-to-date cross-shop P&L
- 22:00 sofa with phone, Instagram DM triage across three shops

**Pain (with euro number where defensible).**
- ~€40k-80k/yr leaks across 3 shops in missed-call bookings (web-research §1).
- Sunday-evening triage costs ~90 min/week × 50 weeks = ~75 hrs/yr at her time-cost (>€150/hr) = €11k+/yr.
- Cross-shop "is everything OK?" anxiety is the largest non-monetary cost.

**The promise.** Sunday evening becomes 15 minutes. Liv sees what's about to break before Aoife does.

**Anti-list.**
- Liv never decides to fire, hire, or promote.
- Liv never speaks for a Manager to her own team.
- Liv never moves a customer between shops without the customer's request.
- Liv never edits brand or pricing.

**Failure mode today.** Phorest's chain story is OK but generic; Aoife reads three Phorest dashboards and consolidates in Excel. Mobile UX is weak; she's on her phone all day.

**Failure mode in 6 months.** Phorest ships a chain dashboard refresh. Aoife stays because of switching cost, not delight.

**Ambition rung.** R1 Day 1 → R4 Month 12.

**Hierarchy edges.** OWNER at each shop (independent memberships per ADR 0010). Direct line to each Manager. May intervene at any level but typically respects the Manager's authority.

**Configurations.** C7 small chain (2-5 shops); C8 mid chain (6-15) at v2; C13 multi-brand portfolio (1-5+ brands).

**Verticals.** All v1/v2 verticals; most commonly Hair, Beauty.

**Owner psychology variants.**
- **First-time Founder** (one shop became two): more reassurance, more "is this normal?".
- **Serial entrepreneur** (third venture): less hand-holding; trust the second derivative.
- **Inheritor** (took over family chain): legacy-respect; "your mother's Friday cash routine still encoded."

**No-app variant.** Rare for Founder (multi-shop visualisation requires visual surfaces). Possible for older inheritor; gets WhatsApp + voice digest equivalents.

---

## P2a — Owner-with-Manager (single-shop)

**Real-world example.** Roisín Doherty. Owns Aurora Studio (single shop); Niamh manages the floor; Roisín hands-off-floor.

**What she really needs to know.**
> *Niamh approved Mary's refund (€60). She queued one for your call: €180 — Lara's late client, unhappy. Recommendation: refund. Your week is on plan; Saturday is full; one Senior on Sunday is the only weak slot.*

**Tuesday.** [INFERRED]
- 08:00 emails over breakfast at home; reads Niamh's Monday close
- 10:00 in shop, walks floor, talks to two Seniors
- 12:00 meets supplier on-site
- 14:00 home; afternoon admin (accountant, marketing, supplier payments)
- 17:00 brief end-of-day call with Niamh
- 21:00 phone-check; one DM, one Niamh question

**Pain.**
- The "what should I be looking at?" fog. Phorest gives reports; doesn't tell her what matters.
- Refund-cap escalations from Niamh interrupt her day.

**Promise.** Liv tells her what matters; Liv handles the cap escalations as one-tap approvals.

**Anti-list.**
- Doesn't substitute for her conversation with Niamh.
- Doesn't replace the floor walk-through.
- Doesn't decide on staff matters.

**Rung.** R1 Day 1 → R4 Month 12.

**Edges.** OWNER; one tier above Niamh (ADM).

**Configurations.** C5, C6.
**Verticals.** Hair, Beauty primarily.
**No-app variant.** Possible — interacts via WhatsApp + voice; weekly digest as voice-note.

---

## P2b — Owner-no-Manager (working owner)

**Real-world example.** Conor McGee. Single-chair barbershop in Stoneybatter; one apprentice (Mo); part-time Saturday receptionist (Síobhan).

**What she really needs to know.**
> *Phone rang twice during your last cut — both regulars. I have them rebooked. Conor McGee wants Saturday at 3. You have 4 walk-ins on the schedule today; cash so far €245.*

**Tuesday.** [INFERRED]
- 08:30 opens, returns voicemails (4 from Monday close)
- 09:00 first client; phone rings during cut
- 10:00 Mo arrives, takes walk-in; Conor returns calls (two already booked elsewhere)
- 12:00 standing-sandwich + Instagram DMs
- 15:30 regular cancels via WhatsApp; doesn't see for 20 min; slot empty
- 18:00 close + Excel cash-and-tip update

**Pain.**
- Missed calls during cuts → ~€8-15k/yr revenue lost (web-research §1).
- Excel admin steals dinner-time, ~10 hrs/week.
- Empty-slot recovery never happens.

**Promise.** Liv answers the phone. Liv recovers empty slots from waitlist. Liv closes the day with him in 5 minutes, not 30.

**Anti-list.**
- Tip allocation between Conor and Mo (Liv records but never decides).
- Brand decisions.
- The Conor-Mo dynamic.

**Rung.** R1 Day 1 → **R3 Month 3** (Liv IS the team) → R5 Month 12.

**Edges.** OWNER; informal mentor to Mo; partner-of-convenience to Síobhan.

**Configurations.** C2, C3, C4 (and C10 chair-rental host variant).

**Verticals.** Hair (especially barbershop), Beauty (solo lash/brow).

**Owner psychology variants.** Common: ex-employee-now-owner (collegial peerness with Liv); first-time owner (reassurance-heavy register).

**No-app variant.** Common — older P2b interacts via WhatsApp + voice only.

---

## P3 — Manager

**Real-world example.** Niamh Byrne. Manages Aurora Studio's floor for Roisín; 14 staff including herself.

**What she really needs to know.**
> *Lara called in sick. Her four bookings: I've messaged the customers and offered Niamh-Tuesday or Sarah-Thursday. Three responses in. One needs your call. Today's first walk-in arrives in 12 minutes; Mo's free.*

**Tuesday.** [INFERRED]
- 07:45 arrives early; reads overnight DMs
- 08:30 stand-up
- 10:00 Lara sick; rebook 4 customers (40 min on phone)
- 12:30 floor walk; reassigns walk-in
- 15:00 €180 refund — texts Roisín; approved at 15:42
- 18:00 daily cash close + tomorrow prep
- 22:30 evening DM thread

**Pain.**
- Re-rota when a Senior calls in sick (~3-5 hrs/week).
- Cap-bound refunds requiring Owner ping (+30-90 min wait).
- Late-evening DM coverage on her own time.

**Promise.** Liv handles the rebook list. Liv queues cap-bound refunds with a recommendation Owner can one-tap. Liv takes the 22:30 DM.

**Anti-list.**
- Disciplinary conversations.
- Hire conversations.
- Promotion to senior-w-admin.
- Anything Owner has flagged "ask me first."

**Rung.** R1 Day 1 → R3 Month 6.

**Edges.** ADM; reports to OWNER; supervises STA + REC.

**Configurations.** C5, C6, C7 (per shop), C8 (per shop), C12 partnership.

**Verticals.** All.

**No-app variant.** Possible — but rare; the Manager surface is multi-staff visual.

---

## P4a — Senior STAFF

**Real-world example.** Lara O'Connor. Top stylist at Aurora Studio. 40% of revenue. Books 3 weeks out.

**What she really needs to know.**
> *Mary just rebooked you for Nov 4.*

That's it. Often the entire day's Liv interaction.

**Tuesday.** [INFERRED]
- 08:45 reads "My Day"; 3 bookings + 1 empty 14:00
- 09:00 Mary McNamara (regular 7yrs); they talk wedding
- 11:30 push: 14:00 just filled
- 14:00 new client; offers her direct WhatsApp card
- 16:30 push: Mary booked Nov 4
- 17:30 done; checks her week's earnings (her, not shop)

**Pain.**
- Phone juggling between cuts.
- Empty-slot anxiety on quiet days.
- Front-desk sometimes mis-books her sacred Tuesday lunch (12:30-13:00).

**Promise.** Liv pushes when next client confirms. Liv fills gaps from waitlist with stylist-preference match. Liv shows her her week's earnings (her). Liv blocks her sacred lunch automatically.

**Anti-list (the longest of any persona).**
- Never books one of her regulars with anyone else.
- Never pushes a refund without her input.
- Never sees her tip totals.
- Never sees her colleagues' slates.
- Never writes in her voice to her customer.
- Never volunteers her availability outside her stated working hours.

**Rung.** R1 Day 1 → R2 Month 12. **Deliberately low** — the senior's craft is the senior's. Liv removes friction; never enters the relationship.

**Edges.** STA; reports to ADM (or ADM-D if scoped under one).

**Configurations.** C4-C8. C10 chair-rental (where she IS effectively a one-person tenant).

**Verticals.** All.

**No-app variant.** Possible; gets push via SMS.

---

## P4b — Senior-with-admin

**Real-world example.** Sarah Walsh. Senior stylist at Aurora Studio with delegated authority over the colour service-line — approves time-off for the colour team and refunds within the colour-line cap.

**What she really needs to know.**
> *Time-off request from Mo for the 12th-14th. Your team's covered Tue and Thu; need Niamh's review for Wed. Approve with that condition?*

**Tuesday.** [INFERRED]
- Same as P4a's day for the chair work
- Plus: 10:30 reviews and approves a same-day time-off swap on her phone between clients
- Plus: 17:00 reviews her team's week (her colour team's bookings, gaps, retention)

**Pain.**
- Authority makes the customer-relationship sometimes awkward (a regular asks her about pricing changes she has no authority over).
- The "I'm a stylist AND I'm partly running this" identity tension.
- Owner sometimes overrides her without telling her.

**Promise.** Liv respects her dual role. Authority within scope is invisible-but-clean (one-tap approvals). Outside her scope, Liv routes elsewhere without involving her.

**Anti-list.** As P4a plus: doesn't make Owner-only decisions visible to her unless she's involved.

**Rung.** R1 Day 1 → R3 Month 9.

**Edges.** STA + `delegations` row from ADM with scope. Reports to ADM. Supervises the STA + JR within her scope.

**Configurations.** C6 mature single-shop only.

**Verticals.** Hair, Beauty primarily.

---

## P5 — Junior STAFF

**Real-world example.** Mo Devlin. Six weeks into a barber apprenticeship at Aurora Cuts. No client base.

**What she really needs to know.**
> *Today: 2 cuts, €30 in. One walk-in interested in rebooking — tap to offer her a slot.*

**Tuesday.** [INFERRED]
- 09:00 phone says "no bookings"; practices fade on uncle
- 10:30 first walk-in; Conor watches; €15
- 12:00 lunch alone
- 13:30 second walk-in; doesn't know how to "book" them; asks Conor
- 15:00 walk-in asks for Conor specifically; Mo waits 'til 17:00
- 17:00 closes till with Conor

**Pain.**
- Empty days = anxiety + no income.
- Doesn't know how to convert walk-in to rebook.
- Empty-state on the dashboard feels like a verdict.

**Promise.** Liv hero-states the empty day ("Your day is open — here's the walk-in flow"). One-tap rebook of a walk-in. Daily 18:00 push: "Today: 2 cuts, €30, 1 customer interested in rebooking."

**Anti-list.**
- Doesn't push him to do work above his skill.
- Doesn't expose his earnings to anyone but him + Conor.
- Doesn't shame the empty days.
- Doesn't tell the team chat "Mo had a quiet day."

**Rung.** R1 Day 1 → R2 Month 12. Stays low-touch.

**Edges.** STA; reports to ADM (or directly to OWN in C4).

**Configurations.** C4-C8.

**Verticals.** Hair (apprentice barbers, junior stylists) most common; Beauty (junior tech).

**No-app variant.** **Common** — apprentice barbers often don't install the staff app; gets day-list via SMS.

---

## P6 — Receptionist

**Real-world example.** Síobhan Kelly. Front desk Wed-Sat at Aurora Studio. Tablet at desk; phone in hand.

**What she really needs to know.**
> *Three on the waitlist for tonight. Mary McGuire said any time after 6. No-show at 14:30 — I've drafted the waitlist message; tap to send.*

**Wednesday (her Tuesday).** [INFERRED]
- 08:30 opens desk; reads overnight bookings/cancels
- 09:00 first call: regular wants Thu→Fri move
- 11:00 walk-in: new customer wants "any senior, any time today"; Síobhan offers 14:00 with Lara
- 13:00 lunch on the desk
- 14:30 Senior no-show; triages waitlist (8 min)
- 16:30 daily cash sums; €15 discrepancy
- 18:30 closes desk

**Pain.**
- Multi-staff scheduling cognitive load.
- No-show recovery (every day).
- Cash discrepancies (chase manually).
- Phone constantly.

**Promise.** Multi-staff calendar smart-suggests. No-show waitlist auto-message draft. Cash-discrepancy auto-flag. Voice line takes the half of calls that don't need her.

**Anti-list.**
- Doesn't take walk-in conversations off her — they're her relationship-building moments.
- Doesn't escalate to Manager on small things she can handle.
- Doesn't surface stylist-team dynamics to her.

**Rung.** R1 Day 1 → R3 Month 6 (heavy use).

**Edges.** REC; reports to ADM.

**Configurations.** C5, C6, C7 (per shop), C8 (per shop), C13 (per brand).

**Verticals.** All with multi-staff configurations.

**No-app variant.** Tablet kiosk variant — never installs the app; works in browser kiosk mode.

---

## P7 — Customer

See `docs/customer-typologies.md` for the six archetypes (CT1-CT6) and Liv's posture per type.

---

## Compose table — persona × configuration × vertical with rung commitment

Filtered to populated cells (per `persona-vertical-configuration-matrix.md`). Rung notation = Day 1 / Month 12 commitment.

| Cell | Day 1 | Month 12 |
|---|---|---|
| P1 × C7-C8 × Hair | R1 | R4 |
| P1 × C13 × multi-vertical | R1 | R4 |
| P2a × C5-C6 × Hair/Beauty | R1 | R4 |
| **P2b × C2-C4 × Hair (barbershop)** | R1 | **R5** (Liv = team) |
| P2b × C2-C4 × Beauty (lash/brow) | R1 | R4 |
| P2b × C10 (chair-rental host) | R1 | R3 (v1.5) |
| P3 × C5-C8 × all | R1 | R3 |
| P4b × C6 × Hair/Beauty | R1 | R3 |
| P4a × all | R1 | R2 |
| P5 × C4-C7 × all | R1 | R2 |
| P6 × C5-C8 × all | R1 | R3 |
| P7 (CT1-CT6) × all | R2 | R3 |

The R5 commitment for P2b in barbershop heartland is the deepest single bet. F7 anchors it; F8 architects to deliver it.
