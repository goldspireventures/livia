# Marketing-promise vs product-truth audit

- **Owner:** founder
- **Last audited:** 2026-05-06 (Task #49)
- **Cadence:** weekly Monday review (see `docs/operating-cadence.md` → "Promise integrity")
- **Gating power:** A row in state `build-before-G2` blocks Gate 2. A row in state `build-before-G3` blocks Gate 3 (see `docs/launch-plan.md`).

The audit's job is to keep `livia.io` honest. Every claim on the marketing surface is mapped to one of four decisions:

- **`build-before-G2`** — the claim must be true before closed beta opens. Linked to a tracker task.
- **`build-before-G3`** — the claim must be true before public launch. Linked to a tracker task.
- **`defer-and-remove-claim`** — claim is rewritten or removed on the marketing site **today**, in the same PR as this audit. The feature returns to the marketing copy only when it actually ships.
- **`rewrite-claim`** — claim is reworded today to match what the product actually does, without removing the feature from the marketing surface.

**Process rule:** no row may sit in `build-before-G3` indefinitely. If it isn't on a tracker by the next Monday review, it auto-converts to `defer-and-remove-claim`.

---

## The audit

| # | Claim (verbatim) | Reality today | Decision | Owner | Linked task / edit |
|---|---|---|---|---|---|
| 1 | "A Livia AI replies to customer messages instantly **across WhatsApp, Instagram, and SMS**, seamlessly booking them into your calendar…" (`home.tsx` AI Inbox pillar; FAQ item-4 echoes it) | SMS is live via Twilio. WhatsApp and Instagram inbound do **not** exist — no webhook, no schema, no provider account. | `rewrite-claim` (now) + `build-before-G3` for the missing channels | founder | **Edit applied:** AI Inbox pillar + FAQ item-4 reworded to "across SMS today, with WhatsApp and Instagram joining at public launch." Tracker: needs new task — see follow-up §1 below. |
| 2 | "Smart no-show recovery, beautifully timed automated reminders, and **flexible deposit logic** that protects your bottom line." (`home.tsx` Revenue Protection pillar) + "Custom Deposit Logic" (Studio tier bullet) | Reminder schema + service exist; deposits do **not**. Stripe Connect not live (`launch-plan.md` L6/L7). The `DEPOSITS_ENABLED` feature flag is defined but no surface honours it. | `defer-and-remove-claim` + `build-before-G3` | founder | **Edit applied:** "flexible deposit logic" removed from Revenue Protection pillar; Studio tier "Custom Deposit Logic" replaced with "Deposit-ready scheduling (deposits roll out at public launch)". Tracker: existing task **"Wire Stripe billing so shops can actually subscribe"** covers L7; deposits-via-Connect (L6) needs a separate task — see follow-up §1. |
| 3 | "Beautifully timed **automated reminders**" (Revenue Protection pillar) | Schema + service implemented (`bookings`, `bookingsService.scheduleReminders`). The cron job that fires them is **not** scheduled in production. | `build-before-G2` | founder | Tracker: existing task **"Schedule the booking-reminder cron in production"** (visible in current task list). No marketing edit needed — claim is structurally true; only operational wiring is missing. |
| 4 | Pricing tiers "1 staff / 5 staff / unlimited staff" at €49 / €99 / €149 | Tiers are real product intent (see `launch-plan.md` L7). Stripe Billing is **not** live; there is no checkout link from the dashboard, no subscription state on the business row, no webhook handling. | `rewrite-claim` (now) + `build-before-G3` | founder | **Edit applied:** Pricing section gains a small "Pricing locks at public launch — beta is on the house" line under the H2, so the tiers read as forward-looking, not as today's checkout offer. Tracker: existing task **"Wire Stripe billing so shops can actually subscribe"**. |
| 5 | "Are you GDPR and **EU AI Act compliant**? — Yes. … fully aligned with the requirements of the EU AI Act." (FAQ item-6) | EU AI Act Art. 50 disclosure copy lives in `lib/ai-disclosure` and is wired into `ai-chat.service` first-message and `booking-emails.service`. Public chat-widget persistent footer + outbound SMS prefix surfacing (`launch-plan.md` C1, C2) are **partially** live (in service, not visually verified on the widget UI). | `rewrite-claim` (now) + `build-before-G2` for residual surfacing | founder | **Edit applied:** "fully aligned with the requirements of the EU AI Act" → "aligned with EU AI Act Art. 50 — every Liv-authored message identifies itself as AI" (specific is more honest than absolute). Tracker: the residual surface verification has no tracker yet — see follow-up §2. **Compliance flag:** any future change to the FAQ-6 wording goes through an ADR (per task brief), not a silent edit. |
| 6 | "Built in Europe, for Europe… **Your data stays in the EU**." (FAQ item-6) | Drizzle/Postgres provider is region-agnostic in dev. Production deployment region is **not** pinned to EU and not codified in deployment config. The legal claim is therefore aspirational. | `rewrite-claim` (now) + `build-before-G3` | founder | **Edit applied:** "Your data stays in the EU." → "EU data residency rolls out at general availability — beta runs on the same EU-region infrastructure we'll lock for launch." Tracker: needs new task — see follow-up §3. **Compliance flag:** GDPR-adjacent — any further wording change goes through an ADR. |
| 7 | "Every shop's day, week, and money in one calm, precise view." (Owner Cockpit pillar) | Dashboard cockpit ships and is restricted to OWNER + ADMIN; STAFF gets `/my-day` (Task #48). The "money" lens depends on `bookings.sourceConversationId` (Engineering E6) for the "Liv made you €X" signal. The unqualified claim is true for the persona the pillar names ("Owner"). | `rewrite-claim` (cosmetic only) — no other action | founder | **Edit applied:** None to the pillar copy itself; it accurately describes the OWNER experience. The pillar header retains "Owner Cockpit" so the persona is explicit. |
| 8 | "...customer messaging via AI, **payments**, and no-show protection..." (FAQ item-1) | Payments are not live (no Stripe Billing, no Connect). Calling out "payments" in the elevator pitch overstates the product. | `rewrite-claim` (now) + `build-before-G3` | founder | **Edit applied:** FAQ item-1 reworded to "Payments and no-show deposits roll out at public launch." Tracker: same as row #2 (Stripe billing + deposits). |
| 9 | "We **charge** a flat monthly fee based on your tier." (FAQ item-7) | Stripe Billing is not live; nobody is being charged. Pairs with row #4 (pricing tiers are forward-looking). | `rewrite-claim` (now) + `build-before-G3` | founder | **Edit applied:** FAQ item-7 reworded to "Pricing locks at public launch with a flat monthly fee per tier — closed beta is on the house." Tracker: same as row #4 (Stripe billing). |
| 10 | "Beautifully timed **automated reminders**" (Revenue Protection pillar) — present-tense | The reminders schema and service are implemented, but the production cron is not scheduled (see row #3). Stating "automated reminders today" overstates live behaviour. | `rewrite-claim` (now) — reuses row #3's tracker | founder | **Edit applied:** Pillar reworded to "Beautifully timed booking reminders and smart no-show recovery" — drops the "today" temporal claim until cron is live in production. |

---

## Follow-ups generated by this audit

The audit produced three new units of work for the tracker. The founder reviews and accepts/rejects each as part of the same Monday review that consumes this doc.

1. **Wire WhatsApp + Instagram inbound channels** — until both work, the AI Inbox pillar can only mention SMS. (G3 blocker. Pairs with deposits-via-Stripe-Connect, which is L6 in the launch plan and currently unticketed at task level.)
2. **Verify EU AI Act Art. 50 surfaces are visible end-to-end** — the disclosure copy exists in `lib/ai-disclosure` and the services consume it, but no automated test or screenshot review confirms the public chat widget footer + outbound SMS prefix are visually present in production. (G2 blocker.)
3. **Pin the production deployment region to the EU and codify it in deploy config** — required to back the "your data stays in the EU" claim. (G3 blocker. Compliance-adjacent — needs an ADR documenting the region choice.)

These follow-ups are proposed via `proposeFollowUpTasks` alongside this audit and will appear in the tracker as PROPOSED rows depending on Task #49.

---

## What this doc is not

- It is **not** a backlog. New features only land in the tracker after the founder accepts a `build-before-G2/G3` row at the Monday review.
- It is **not** an excuse to silently soften copy. The marketing edits applied with this audit are listed inline above; every diff is reviewable in the same commit.
- It is **not** a one-off. The "promise integrity" check in `docs/operating-cadence.md` walks this table every Monday.
