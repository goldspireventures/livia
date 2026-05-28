# Marketing-promise vs product-truth audit

- **Owner:** founder
- **Last audited:** 2026-05-20 (Phase 9 re-audit)
- **Cadence:** weekly Monday review (see `docs/operating-cadence.md` → "Promise integrity")
- **Gating power:** A row in state `build-before-G2` blocks Gate 2. A row in state `build-before-G3` blocks Gate 3 (see `docs/launch-plan.md`).

The audit's job is to keep `livia.io` honest. Every claim on the marketing surface is mapped to **exactly one** of four decision states:

- **`build-before-G2`** — the claim must be true before closed beta opens. Linked to a tracker task.
- **`build-before-G3`** — the claim must be true before public launch. Linked to a tracker task.
- **`defer-and-remove-claim`** — claim is rewritten or removed on the marketing site **today**, in the same PR as this audit. The feature returns to the marketing copy only when it actually ships.
- **`rewrite-claim`** — claim is reworded today to match what the product actually does, without removing the feature from the marketing surface.

**Process rule:** every row holds exactly one of the four states above. When a single claim has two consequences (e.g. "rewrite copy today, AND build the feature for G3"), it is split into two rows that share a "Pair" tag.

**Process rule:** no row may sit in `build-before-G2` or `build-before-G3` without a linked tracker task by the next Monday review. If a row's tracker is `TBD` for more than one week, it auto-converts to `defer-and-remove-claim` and the marketing copy is rewritten that morning.

---

## The audit

| # | Pair | Claim (verbatim) | Reality today | Decision | Owner | Linked task / edit |
|---|---|---|---|---|---|---|
| 1 | — | "...across WhatsApp, Instagram, and SMS..." (`home.tsx` AI Inbox pillar + FAQ item-4) | SMS is live via Twilio. WhatsApp and Instagram inbound do **not** exist — no webhook, no schema, no provider account. There is no tracker task to build them, and no founder commitment to ship them by any specific gate. | `defer-and-remove-claim` | founder | **Edits applied 2026-05-06:** WhatsApp + Instagram named-channel mentions removed entirely from the AI Inbox pillar and FAQ item-4. New copy talks about SMS today and "more inbound channels on the roadmap" — open-ended, no gate-time commitment. The named channels return to marketing copy only when a tracker task to build them is opened and accepted. |
| 2a | B | "...flexible deposit logic..." (Revenue Protection pillar) + "Custom Deposit Logic" (Studio tier bullet) | Deposits do not exist. `DEPOSITS_ENABLED` flag exists but no surface honours it. Stripe Connect not live. | `defer-and-remove-claim` | founder | **Edit applied 2026-05-06:** "flexible deposit logic" removed from Revenue Protection pillar; Studio tier line replaced with "Deposit-ready (rolls out at public launch)". |
| 2b | B | (same) — Studio tier promises deposits at GA | Not built. | `build-before-G3` | founder | **Linked task: #58** — "Connect Stripe so shops can take real deposits" (covers `launch-plan.md` L6). |
| 3 | — | "Beautifully timed booking reminders" (Revenue Protection pillar — was "automated reminders" pre-edit) | Schema + service implemented (`bookingsService.scheduleReminders`). The cron that fires them is **not** scheduled in production. | `build-before-G2` | founder | **Linked task:** existing tracker task **"Schedule the booking-reminder cron in production"**. Also: edit applied to drop the present-tense "today" framing from the pillar copy, so the claim matches what fires once the cron is live. |
| 4a | C | Pricing tiers €49 / €99 / €149 displayed without a checkout | Stripe Billing not live. No checkout link, no subscription state, no webhook. | `rewrite-claim` | founder | **Edit applied 2026-05-06:** Pricing section gains "Pricing locks at public launch — closed beta is on the house." line under the H2; FAQ item-7 reworded similarly. |
| 4b | C | (same) — implicit promise that the listed tiers will be charged at GA | Not built. | `build-before-G3` | founder | **Linked task:** existing tracker task **"Wire Stripe billing so shops can actually subscribe"** (covers `launch-plan.md` L7). |
| 5a | D | "...fully aligned with the requirements of the EU AI Act." (FAQ item-6) | Disclosure copy in `lib/ai-disclosure` is wired into `ai-chat.service` first message + `booking-emails.service`. SMS prefix wired in service code; widget footer surfacing not visually verified. | `rewrite-claim` | founder | **Edit applied 2026-05-06:** FAQ item-6 reworded to specify *which* surfaces carry the disclosure today (chat + email) and call out SMS + widget footer as in-progress for closed beta. **Compliance flag — ADR required:** any further wording change to FAQ-6 goes through an ADR, not a silent edit. |
| 5b | D | (same) — implicit promise that all customer-facing surfaces carry the disclosure | Chat + email confirmed; SMS + widget footer not visually confirmed. | `build-before-G2` | founder | **Linked task: #56** — "Make sure the Liv 'I'm an AI' notice is visible to every customer." |
| 6a | E | "Your data stays in the EU." (FAQ item-6, pre-edit) | Production deployment region is not pinned and not codified in deploy config. | `rewrite-claim` | founder | **Edit applied 2026-05-06:** the absolute residency claim removed from FAQ item-6; replaced with "Pinning production hosting to an EU region is a public-launch commitment, not a current claim." **Compliance flag — ADR required:** GDPR-adjacent; any future wording change to FAQ-6 goes through an ADR. |
| 6b | E | (same) — implicit GA-time commitment to EU residency | Not codified. | `build-before-G3` | founder | **Linked task: #57** — "Pin Livia's production hosting to the EU and write it down" (includes ADR). |
| 7 | — | "Every shop's day, week, and money in one calm, precise view." (Owner Cockpit pillar) | Cockpit ships and is restricted to OWNER + ADMIN; STAFF gets `/my-day` (Task #48). The pillar header names "Owner" so the persona is explicit. | `rewrite-claim` (cosmetic-only — no edit needed) | founder | **No edit applied.** Pillar copy accurately describes the OWNER experience. The "money" lens depends on `bookings.sourceConversationId` (Engineering E6); E6 is in `launch-plan.md` and out of scope for this audit. |
| 8a | B | "...customer messaging via AI, payments, and no-show protection..." (FAQ item-1, pre-edit) | Payments are not live. | `rewrite-claim` | founder | **Edit applied 2026-05-06:** FAQ item-1 drops present-tense "payments" claim — "Payments and no-show deposits roll out at public launch." |
| 8b | B | (same) — implicit promise of payments at GA | Not built. | `build-before-G3` | founder | **Linked task: #58** (shared with row 2b — Stripe Connect for deposits). |
| 9a | C | "We charge a flat monthly fee based on your tier." (FAQ item-7, pre-edit) | Stripe Billing not live; nobody is being charged. | `rewrite-claim` | founder | **Edit applied 2026-05-06:** FAQ item-7 reworded — "Pricing locks at public launch with a flat monthly fee per tier — closed beta is on the house." |
| 9b | C | (same) — implicit promise of charging at GA | Not built. | `build-before-G3` | founder | **Linked task:** existing tracker task **"Wire Stripe billing so shops can actually subscribe"** (shared with row 4b). |

---

## Summary by state

- `rewrite-claim` (resolved today): rows 4a, 5a, 6a, 7, 8a, 9a — six marketing edits applied in the same PR as this audit.
- `defer-and-remove-claim` (resolved today): rows 1, 2a — named channels and "deposit logic" stripped from `livia.io`.
- `build-before-G2` (gates closed beta): rows 3, 5b. Both linked to live trackers.
- `build-before-G3` (gates public launch): rows 2b/8b (#58), 4b/9b (existing Stripe billing task), 6b (#57). All four linked.

Gate 2 cannot be declared until rows 3 and 5b flip to ✅. Gate 3 cannot be declared until 2b/4b/6b flip to ✅.

---

## Phase 9 re-audit (2026-05-20) — product shipped since May 6

| Row | Prior state | Current reality | Updated decision |
|-----|-------------|-----------------|------------------|
| 3 | `build-before-G2` — cron not scheduled | T-24h reminders via Inngest (`booking-reminder-t24`) + cron fallback | **✅ Resolved** — mark G2 row 3 done when Inngest enabled in prod |
| 4b / 9b | `build-before-G3` — Stripe Billing not live | `GET /billing`, Checkout session, webhooks, Settings → Billing tab (Phase 2) | **✅ Resolved** — Stripe still needs production keys + first paid sub (Gate 3 ops) |
| 5b | `build-before-G2` — widget footer unverified | `lib/ai-disclosure` + chat first message + SMS prefix + voice opening line | **✅ Resolved** for chat/SMS/voice; visual widget footer verify in QA |
| E12 (launch-plan) | N+1 cockpit | `enrichBookingsBatch` (Phase 6) | **✅ Resolved** |
| E10 | rate limit | `public_chat_rate_limits` DB-backed (Phase 4) | **✅ Resolved** |
| Voice wedge | not in original audit | English-IE Twilio gather → Liv (Phase 7) | Marketing must not claim WhatsApp/IG voice; SMS+voice only |

**Remaining `build-before-G3` blockers for public launch:**

| Row | Claim | Still required |
|-----|-------|----------------|
| 2b / 8b | Deposits / Stripe Connect for shop money | Connect onboarding + deposit flows (#58 / launch-plan L6) |
| 6b | EU production residency codified | ADR + deploy region pin (#57) |
| 1 | WhatsApp / Instagram inbound | Remove or defer claims (unchanged) |

**Gate 3 ops (not code):** first paid Stripe subscriber, App/Play live, `livia.io` live, legal pages, SOC 2 kickoff — see `docs/launch-plan.md` and `docs/compliance/soc2-type1-kickoff-checklist.md`.

---

## What this doc is not

- It is **not** a backlog. New features only land in the tracker after the founder accepts a `build-before-G2/G3` row at the Monday review.
- It is **not** an excuse to silently soften copy. The marketing edits applied with this audit are listed inline above; every diff is reviewable in the same commit.
- It is **not** a one-off. The "promise integrity" check in `docs/operating-cadence.md` walks this table every Monday.
