# Post-mortems

**Status:** Living. Every SEV1 + SEV2 + SEV-SEC incident lands here within 5 business days. Per `docs/engineering/incident-response.md`.

## Naming

`YYYY-MM-DD-<short-slug>.md` — e.g., `2026-09-14-voice-receptionist-degradation-ie.md`.

## Template

Copy the block below into a new file per incident.

```markdown
# Post-mortem: <one-line title>

**Date of incident:** YYYY-MM-DD
**Severity:** SEV1 | SEV2 | SEV-SEC
**Duration:** Xh Ym (HH:MM start → HH:MM resolved, all CET)
**Author:** <name>
**Reviewers:** <names>
**Status:** Draft | Reviewed | Action items in progress | Closed

## Summary

(2 sentences. What broke. What we did.)

## Impact

- **Tenants affected:** N (of M total).
- **Customers affected:** ~N.
- **Money lost or at-risk:** €X (refunds; missed bookings; service credits).
- **Trust impact:** describe (status-page disclosure; design-partner notification; public blog post).

## Timeline (CET)

| Time | Actor | Action |
|---|---|---|
| HH:MM | <who> | <what> |
| ... | ... | ... |

## Root cause

(Technical root cause. Be specific. Code references, log references, query references.)

(Organisational root cause. What process let this happen? What signal was missed? What tradeoff was implicit?)

## What went well

- ...
- ...

## What didn't

- ...
- ...

## Action items

| # | Owner | Action | Due | Tracked at |
|---|---|---|---|---|
| 1 | | | | (issue link) |

## Eval / SLO catch

(What eval signal or SLO would have caught this earlier? What are we adding so this class of incident doesn't recur silently?)

## Customer comms

- Status page updates posted at: HH:MM, HH:MM, HH:MM.
- Design partner notification: HH:MM via WhatsApp from founder.
- Public blog post: published YYYY-MM-DD (link).
- Affected-tenant CS email: sent YYYY-MM-DD.

(Or: "No customer comms required because [reason].")

## Counsel notification (SEV-SEC only)

- Counsel notified: HH:MM.
- GDPR clock start: HH:MM.
- DPA notification: YYYY-MM-DD.
- Affected controller (tenant) notification: YYYY-MM-DD.
```

## Discipline

- **Blameless.** Names actors only as "primary on-call", "comms lead", etc. unless the lesson is procedural and naming is necessary.
- **Honest.** Bad timelines, missed escalations, ignored signals — surfaced.
- **Specific.** "We had an LLM outage" is not a root cause. "Anthropic 503s for 8 minutes; our retry budget exhausted; fallback model not pre-warmed" is.
- **Actionable.** Every post-mortem produces ≥1 action item with owner + due date.

## Cadence

- Drafted within 5 business days.
- Reviewed by author + on-call lead + (for SEV1/SEV-SEC) founder.
- Action items tracked in normal issue tracker.
- Closed when action items complete.

## Index

(Empty until first incident.)
