# v3 real-world scenarios — pain → Liv/Livia response

**Status:** Active catalog (2026-05-22)  
**Program mapping:** [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md) Block N (booking continuity), Blocks F, D, M  
**Experience:** [`V3-EXPERIENCE-SPEC.md`](./V3-EXPERIENCE-SPEC.md)

This document is the **why** behind v3 depth — not a user-facing doc. Engineering pulls work items from here into blocks.

---

## Scenario 01 — Post-web-booking Instagram handoff (your example)

**What happens today (broken):** Client books on salon website. Salon policy: “Message @[stylist] on Instagram with your handle and reference photos.” Client does one of: wrong account, forgets handle, sends pics in DM that stylist never links to calendar, booking sits **unconfirmed** while slot is held.

**Why it persists:** Web booking and social identity are different systems. Stylists trust IG for vibe check; software only sent a generic email.

**Livia v3 response — Booking Continuity Bridge (`workflow/booking-continuity`):**

1. On `BOOKING_CREATED` (source `web`), policy pack decides **continuity mode**: `sms_thread` (default), `whatsapp_thread`, `instagram_deep_link`, or `email_only`.
2. Within 60s, customer receives **one** outbound on preferred channel:
   - SMS/WA: “You’re booked Thu 3pm with Alex. Reply here with inspiration pics or questions — we’ll confirm in this thread.”
   - Optional IG path: deep link to **business IG** with pre-filled message token `LIV-{bookingId}` (not “figure out our handle”).
3. Attachments in thread → stored on `booking.media[]`; stylist sees thumbs on booking detail + My Day.
4. **Confirmation state** on booking: `pending_continuity` → `confirmed` when stylist taps or Liv detects intent + policy allows auto-confirm for returning clients.
5. Owner dashboard: “Stuck” queue — web booked &gt;24h, no thread activity.

**Not marketplace:** Livia does not own the customer relationship; salon does. We unify **their** threads.

**Gates:** Meta IG messaging API where available; else deep-link + SMS as SoT. Counsel for medspa pics (health adjacency).

---

## Scenario 02 — New client DM avalanche

**Pain:** Stylist uses IG Quick Replies; still 5–10 messages per new colour client; duplicates across IG, FB, email.

**Livia response:**

- Liv **intake pack** on first inbound: service intent, history, inspiration upload — same schema as web notes.
- Owner sets **channel priority** (SMS &gt; WA &gt; IG).
- Quick replies become **policy templates** versioned per vertical, not copy-paste in Meta app.

**Block:** N + C (Liv templates from registry).

---

## Scenario 03 — “Book Now” on IG but confirm elsewhere

**Pain:** Guest books via Meta button; salon still texts “confirm by replying YES”; double confusion.

**Livia response:**

- Single **confirmation artifact** (ICS + wallet pass link) in first outbound regardless of entry channel.
- `channelType` on booking preserved; marketing site shows same confirm UX as Scenario 01.

**Block:** D (OAuth/social), N.

---

## Scenario 04 — Brand Instagram vs reality at front desk

**Pain:** Feed is editorial; confirmation email is plain text; trust breaks.

**Livia response:**

- **Brand shell** tokens on `/b` + emails (logo, tone, motion variant).
- Liv copy uses vertical vocabulary pack — not generic SaaS.

**Block:** M, L3 white-label (enterprise).

---

## Scenario 05 — No-show and late cancel chaos

**Pain:** Empty chair; stylist awkward about charging; policy not agreed at book time.

**Livia response:**

- Policy pack: notice window, fee %, deposit — shown at confirm with explicit accept (tap).
- Card hold via Stripe (founder lane keys).
- Liv T−48/T−24 reminders in **same thread** as continuity.
- No-show → workflow charges per policy + owner briefing.

**Block:** F (workflow depth), billing.

---

## Scenario 06 — Wrong service duration booked online

**Pain:** Client books “cut” but needs 3h colour; slot too short.

**Livia response:**

- Service **guard questions** on web (hair length, first visit) → Liv suggests duration override before confirm.
- If already booked: inbox **resize proposal** workflow to customer.

**Block:** N + F `waitlist` / reschedule.

---

## Scenario 07 — Stylist running late, client in salon

**Pain:** Reception phones around; client annoyed.

**Livia response:**

- Staff one-tap **running late** → SMS to waiting clients + updated ETA on `/b` status link.
- Liv briefing to owner: ripple impact on afternoon column.

**Block:** F, mobile My Day.

---

## Scenario 08 — Patch test / allergy (beauty/medspa)

**Pain:** Compliance requires 48h patch test; online book allows tomorrow.

**Livia response:**

- Medspa/beauty pack **eligibility rules** block slot until intake complete.
- Consent workflow J1.2 for medspa procedures.

**Block:** J, policy.

---

## Scenario 09 — Tattoo design proof before chair time

**Pain:** DM art back-and-forth; deposit not tied to approved design.

**Livia response:**

- `design-proof` workflow (F): upload → approve → deposit link → book session block.

**Block:** F (v2 scaffold → v3 product).

---

## Scenario 10 — Partner wants payroll but hours live in Livia

**Pain:** Re-keying rota into BrightPay.

**Livia response:**

- Hours SoT in Livia → export/connector (Block A); Liv pay-run briefing.

**Block:** A.

---

## Scenario 11 — Owner on holiday, inbox piling up

**Pain:** Approvals stall; VIPs wait.

**Livia response:**

- `owner-on-holiday` workflow + acting manager ritual.
- Liv escalates only above confidence threshold.

**Block:** F (existing workflow depth).

---

## Scenario 12 — Multi-shop “which location?” confusion

**Pain:** Client books wrong site; chain brand unclear.

**Livia response:**

- Chain picker on `/b`; geo hint from phone; founder chain glance.

**Block:** v2 host/chain + v3 DE multi-city copy.

---

## Scenario 13 — Voice caller, reception overloaded

**Pain:** Phone rings during colour mix; message lost.

**Livia response:**

- Voice → book or → SMS follow-up with summary in inbox thread (same N continuity).

**Block:** D + N.

---

## Scenario 14 — GDPR / DE Impressum on booking page

**Pain:** DE client expects Impressum; Irish-only footer feels foreign.

**Livia response:**

- `regulatory-disclosure-overlay` per locale pack I1.4.

**Block:** I.

---

## Scenario 15 — Franchisee uses parent brand, local phone

**Pain:** Central marketing; local WhatsApp number.

**Livia response:**

- Franchise pack: brand shell from franchisor, channel pack per shop.

**Block:** L + policy.

---

## Scenario 16 — Waitlist when cancellation frees slot

**Pain:** Manual texting waitlist.

**Livia response:**

- F6 waitlist workflow: auto-offer with 15m accept window in SMS thread.

**Block:** F.

---

## Scenario 17 — Class / course booking (fitness)

**Pain:** Capacity and waitlist different from 1:1 chair.

**Livia response:**

- Fitness pack + class entity; mobile E5 classes.

**Block:** E, vertical pack.

---

## Scenario 18 — Allied health — not clinical, but intake heavy

**Pain:** Physio needs history; must not become EHR.

**Livia response:**

- Adjacency intake J1.5; export PDF for practitioner; no diagnosis storage.

**Block:** J.

---

## Scenario 19 — Peer benchmark anxiety

**Pain:** Owner wants “how am I vs last month” without spreadsheet.

**Livia response:**

- Peer insights (v2) + Liv narrative in command hub — anonymized, locale-aware.

**Block:** C + GTM layer.

---

## Scenario 21 — Pet groom: parent books online, groomer needs breed/temperament

**Pain:** Same as Scenario 01 but for dogs — vaccination, matted coat, anxious pet discussed in WhatsApp not on the booking.

**Livia response:** `pet-grooming` pack + pet profiles + continuity SMS asking for breed/behaviour/photos in-thread (Block P + N).

---

## Scenario 20 — Support needs one story

**Pain:** “Customer says they booked” — ops checks five tools.

**Livia response:**

- Internal trace: booking + all channel events + Liv decisions (B2).

**Block:** B.

---

## Priority for v3 engineering (ordered)

| Priority | Scenario | Block |
|----------|----------|-------|
| P0 | 01 Post-web social handoff | N |
| P0 | 05 No-show / policy at book | F + billing |
| P1 | 02 New client intake | N + C |
| P1 | 06 Duration guard | N |
| P1 | 04 Brand continuity | M |
| P2 | 03 IG Book Now unify | D + N |
| P2 | 07 Running late | F |
| P2 | 09 Design proof | F |
| P2 | 16 Waitlist | F |
| P3 | 08 Medspa consent | J |
| P3 | 14 DE regulatory | I |

---

## Research notes (external)

- Salons lose material revenue to no-shows/late cancels; deposits + clear notice windows are industry standard (Yocale, Boulevard, Mangomint).
- Zenoti pushes **direct social booking** with instant confirm — gap we close with **thread continuity**, not another silo.
- Kristina Russell / salon educators document **IG Quick Replies** and email redirects — symptom of missing unified intake (Scenario 02).
