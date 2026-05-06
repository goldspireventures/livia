# Livia — Operating Cadence

How the founder runs the build between Demo Day (May 5) and Gate 3 (Public Launch). This is a rhythm doc, not a process doc — keep it short and follow it.

## Weekly review — Monday 09:00 IST, 30 minutes

1. Open `docs/launch-plan.md`. Walk every gate's acceptance criteria — mark each ✅ / ⏳ / ❌.
2. For every ⏳ that hasn't moved in 7 days: write one sentence on what's blocking it.
3. For each lane, confirm the next 2-3 tracker tasks are correctly promoted from the per-lane backlog.
4. Update the Gate 2 / Gate 3 target dates if drift is real (not aspirational).
5. Post the week's headline ("This week: shipping E6 + L3 + G1") to founder log.

## Daily build cadence

- One tracker task closed per day (single-session-sized; that's why they're scoped that way).
- If a task slips past 1 day, split it into two — don't carry a half-done task overnight.
- Anything that takes more than 2 days lands in the "drift" column at the next weekly review.

## Release cadence

- **Every merge** to main → auto-deploy to staging (`staging.livia.io` once provisioned).
- **Friday 16:00 IST** → cut prod release. No Friday-evening prod deploys after that.
- **Hotfix** path: any P0 can ship to prod any day, but must be paired with an incident note.

## Incident protocol

When a P0 fires (Sentry alert, status page red, design partner reports broken booking):

1. Acknowledge on Statuspage within 5 minutes — even just "investigating".
2. Roll back if the regression is < 1 deploy old. Forward-fix only if rollback is structurally impossible.
3. Post in the design-partner WhatsApp group as soon as the customer impact is understood.
4. Post-incident note in `docs/incidents/YYYY-MM-DD-short-slug.md` within 48 hours: timeline, blast radius, root cause, follow-ups.
5. Any follow-up that takes > 1 day becomes a tracker task in the appropriate lane.

## Design-partner cadence

- **Weekly 30-minute call** with each of the 10 design partners. Founder-led. No slides.
- Standard agenda: what worked this week, what broke, one feature ask, one piece of customer feedback.
- Notes land in `.local/research/design-partners/<shop-slug>/YYYY-WW.md`.
- After each call: any concrete bug → tracker task within 24h. Any feature ask → added to `docs/launch-plan.md` lane backlog (not directly to tracker).

## Sign-off rituals

- **Gate 1 (Demo Day)** — founder narrates the demo script live to one trusted external person.
- **Gate 2 (Closed Beta)** — all 10 design partners confirm install + first booking via WhatsApp screenshot.
- **Gate 3 (Public Launch)** — first paying shop's Stripe Billing webhook fires; founder posts the screenshot publicly.
