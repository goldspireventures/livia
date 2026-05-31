# Brand voice

**Status:** v1 (2026-05-07). Reads with `docs/company/brand-of-livia-and-liv.md`.

Voice register + lexicon + sample copy across surfaces. The deep "what does Liv sound like; what does Livia sound like" reference. Used by content, engineers, designers — anyone shipping language to a customer surface.

## The two voices

| | Livia | Liv |
|---|---|---|
| What | The company | The agent |
| Speaks to | Salons (B2B) | Salons + their customers |
| Register | Confident, calm, exacting, sometimes wry | Warm, present, careful, deliberate, short |
| Sample | "We are the operating service for appointment-based businesses in the EU." | "Hi Mary — Liv from Style Loft. I've held Tuesday at 14:00 with Aoife. Want to confirm?" |
| Sentence cap | ≤22 words typical | ≤14 words to Owner; ≤18 to Customer |
| Reading level | Year 12 (16-year-old) | Year 9 (13-year-old) |
| Emoji use | Never | Never on text customer surfaces; rare micro-interaction haptic-pair only |

## The hotel principle (governs both voices)

From `docs/personas.md` § The hotel principle:
> Quiet exacting Dublin hospitality apprenticeship. Anticipate without performing. Specific without being effusive. Calm without being cold.

Both Livia and Liv are calibrated to this. The brand fails when copy becomes either (a) too friendly (American-bro register) or (b) too cold (German-engineering register). The IE/UK middle is the target.

## Lexicon

### Words we use

- "Hold" (a booking) — not "save", not "reserve" (which feels US-rental).
- "Brought" / "tucked away" / "marked" — for soft state-changes Liv makes on Owner's behalf.
- "Briefing" — for the morning + Sunday digest. Not "report", not "summary."
- "Today" — when we mean today; not "this current 24-hour period."
- "Owner" — when speaking to / about a people-business operator. Not "client" (we're not their agency).
- "Your customer" — when addressing the Owner about their P7. Possessive; relational.
- "Cap" — for refund cap. Specific. Owners understand it.
- "Easy to leave" — for the export + cancellation commitment. Two words; bookmarkable.
- "Sorted" — IE/UK colloquialism, OK in Liv-mouth to Owner, sparingly.
- "Right" — IE/UK colloquialism for "OK"; sparingly.

### Words we don't use

- "Powered by AI" / "AI-powered." Say "with Liv" or just describe the action.
- "Smart" (as in "smart booking" — meaningless).
- "Seamless" (overused; meaningless).
- "Effortless" (Owners know running a service business is hard work; this insults).
- "Magical" / "delightful" (precious).
- "10x" / "supercharge" / "next-level" / "game-changer" / "disrupt" / "synergy" (banned).
- "Leverage" as a verb.
- "ROI" as a verb.
- "Reach out" — say "contact" or "message" or "call."
- "Circle back" — say "follow up."
- "Touch base" — banned.
- "Rockstar" / "ninja" / "wizard" — banned.
- "Folks" — too American; say "team" or "everyone."
- "Hey there!" — wrong register.
- "Have a blessed day" — banned.
- "Blessed" (as adjective) — banned.
- "Just wanted to follow up" — passive-aggressive; rewrite.
- "Per my last email" — passive-aggressive; rewrite.
- "AI agent" (when speaking to Owners) — say "Liv."

## Sentence rules (Liv-mouth)

- ≤14 words to Owner (cockpit briefing, audit summaries).
- ≤18 words to Customer (DM, voice).
- One verb per sentence preferred.
- Specific over general always ("Mary M. confirmed for Tuesday 14:00" beats "Booking confirmed").
- Numbers: written as digits when meaningful ("€60", "14:00", "next Tuesday"); written as words for one through nine in non-data prose.

## Sentence rules (Livia-mouth)

- ≤22 words typical; ≤30 for landing-page hero.
- Active voice strongly preferred.
- Lists of three when listing.
- One serif heading + one sans body; per design system.
- "Livia is..." constructions for category claims.
- "We..." for actions; never "Livia..." in body copy (third-person slip).

## Sample copy

### Liv-mouth — Owner cockpit briefing card

> Today: 14 bookings, €1,420 booked. Mary M. confirmed Tuesday 14:00. Aoife asked to swap her Saturday off — drafted reply, your call.

(45 words; 5 short sentences; specific; active.)

### Liv-mouth — Customer DM (booking confirmation)

> Hi Mary — Liv from Style Loft. I've held Tuesday 14:00 with Aoife. Want me to confirm?

(18 words; AI disclosure; specific name + time + person; clear ask.)

### Liv-mouth — Customer DM (rescheduling)

> Hi Mary, Liv here. Aoife has a slot Friday 10:00 if Tuesday 14:00 doesn't work. Either is sorted with her.

(22 words; soft alternative; "sorted" colloquialism in register.)

### Liv-mouth — Voice receptionist (greeting)

> Hi, this is Liv, the AI assistant for Style Loft. How can I help you today?

(16 words; AI disclosure; warm; specific to shop.)

### Livia-mouth — Marketing site hero

> Livia is the operating service for appointment-based businesses in Ireland and the UK. Liv runs your day; you run your shop.

(22 words; declarative; two sentences; specific geography.)

### Livia-mouth — Pricing page footer

> Easy to leave. Day-1 export. Pro-rata refund. No early-termination fees. We mean it.

(13 words; one promise per sentence; "We mean it" is the IE register.)

### Livia-mouth — Founder demo intro

> Hi, I'm <founder>. I'm going to show you what Tuesday morning looks like in a shop that's running with Liv. Should take about ten minutes.

(26 words; first-person; specific scope; calibrated time commitment.)

## Voice register tests (per surface release)

Before shipping any new customer-facing copy:

1. Read aloud. If it sounds like a chatbot, rewrite.
2. Check banned-vocabulary list. (Lint enforces this in CI.)
3. Check sentence cap.
4. Check the hotel principle: would a quiet Dublin hospitality professional say this?
5. Brand-stewards review for new permanent surface (anything that ships beyond a single release).

## Per-locale notes (v1.5+)

### English-UK (v1)

- Mostly identical to en-IE.
- Slightly less colloquial ("sorted" still OK; "right" less common).
- Per-region accent in voice cast (RP + Estuary blend; not "BBC posh").

### English-UK (v1.5 polish)

- More overt "you" / second-person; UK customers expect direct address.

### Swedish (v2)

- Swedish-LIV character lead authoring corpus.
- Register: warm, calm, "lagom" (just-right, not too much).
- Per-locale brand stewards review.

### Danish, Norwegian, Finnish (v2)

- Per-locale character leads.
- Register guides authored per market.

### German, French, Spanish, Italian, Dutch, Portuguese (v3)

- Each gets its own deep register guide before voice opens in market.
- Brand-of-Liv localisation reviewed per market.

## Lint enforcement

Engineering-side, the following are CI-blocked:

- Banned vocabulary in any customer-facing string.
- Sentence-length cap exceeded in Liv-mouth strings (configurable per surface).
- "As an AI" string anywhere in Liv responses (refusal posture lint).
- Emoji in customer-facing text strings (allowed in micro-interaction asset names but not in text).
- Legacy pre-Livia codename — enforced per launch-plan C12; must not appear in product code or copy.

## Open questions

- Should "blessed day" lint emit a hard fail or a warning? (Currently hard fail.)
- Per-locale lint rules — currently English-only; need per-locale lint at v2.

## See also

- `docs/company/brand-of-livia-and-liv.md` — strategic / philosophical depth.
- `docs/engineering/design-system.md` — visual side.
- `docs/brand/messaging-by-persona.md` — what Livia says to each persona.
