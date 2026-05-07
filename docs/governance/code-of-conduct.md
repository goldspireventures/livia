# Code of conduct

**Status:** v1 (2026-05-07).

## What this is

How we treat each other, our customers, our customers' customers, and the data they entrust to us. Not legalese; not corporate boilerplate. The lived expectations.

## How we treat each other

1. **Calm, present, deliberate.** The same tenets that govern Liv's experience govern how we work together. No performative urgency. No status-by-busyness.
2. **Disagree by writing.** Hard disagreements go into RFC form, not into Slack thread escalations.
3. **Credit publicly, critique privately.** Public criticism of a teammate's work is a process bug.
4. **Assume good intent.** Where you don't understand a colleague's choice, ask before assuming.
5. **Repair quickly.** Conflict is normal. Avoidance is the failure. Apologise specifically; act differently.

## How we treat customers

1. **The customer is not a number.** First names; specific salons; remembered details. Even at scale.
2. **We don't lie about progress.** A delayed feature is a delayed feature. A cancelled feature is a cancelled feature. We say so.
3. **Voice asymmetry.** Our customers (Owners) talk to many salons; their customers (P7) talk to one. We default to amplifying our customer's voice, never overriding it.
4. **Money mentioned by amount.** Refunds discussed in cash terms with specific reasoning. No "we'll take care of it" platitudes.
5. **Boundaries.** We do not work weekends except for SEV1. We do not respond to customer messages at midnight just because we're awake. We model the boundaries we want them to keep with their own customers.

## How we treat customers' customers

The end customer (P7) of a salon never sees us, but they encounter Liv. They are owed:

1. **Honesty about what they are talking to.** EU AI Act Art. 50; we never let Liv pose as human.
2. **Their data not used to sell them other things.** No display advertising; no data resale.
3. **Their conversations not training third-party models.** Anthropic API tier zero-retention.
4. **A working alternative.** "Speak to a human" or "call the shop" always available.
5. **No dark patterns.** Cancellation is one click; opt-out is honoured immediately; no manufactured urgency.

## How we treat data

1. **Tenant-scoped by default.** Cross-tenant access requires opt-in + k≥10 + RFC + audit log.
2. **EU residency by default.** Per `docs/policy/data-residency.md`.
3. **Minimum necessary.** We don't collect what we don't need. We don't keep what we don't need.
4. **Audit on access.** Every break-glass logged; every impersonation logged; every owner-disclosure within 24h.
5. **Erasure honoured fast.** GDPR Art. 17 — soft-delete + 30-day purge.
6. **No "data treasure trove" framing.** Internal language matters. Customer data is a duty, not an asset.

## How we treat suppliers / vendors

1. **EU residency required.** No vendor without EU option.
2. **DPA signed before integration.** No exceptions.
3. **Critical-path vendors have a fallback plan.** Per `docs/engineering/release-pipeline.md` and `docs/policy/data-residency.md` subprocessor map.
4. **Vendor lock-in resisted.** Where possible, we use open standards.

## Things we don't do

- We don't take face-saving shortcuts at customer expense. (E.g., we'd rather post an honest "we got it wrong" status update than a vague "service degraded.")
- We don't rebrand competitor outages to make us look better.
- We don't badmouth competitors in public. Comparisons by feature; never by character.
- We don't poach team members from design partners.
- We don't accept gifts from vendors above modest hospitality.
- We don't speak in headcount-as-virtue. Hiring is a cost; quality is the metric.

## Reporting concerns

- Internal concerns: founder@livia.io or head of CS@livia.io.
- Customer-facing concerns: trust@livia.io.
- Whistleblower / safety: whistleblower@livia.io (read by external counsel + founder; protected per Whistleblower Act 2014 IE).
- Anonymous: an anonymous form lives at `livia.io/contact/anonymous` (v1.5).

## Consequences

Violations of this code, especially data discipline + customer-treatment principles, are grounds for warning → suspension → termination depending on severity. Repeat or severe violations of data discipline = immediate termination + counsel review.

## How this gets revised

Annual review at foundation audit. Team-wide read-aloud once a year. New hires sign on day 1.

## Open questions

- Should this be public (livia.io)? (Currently no; revisit at v1.5 — public CoC strengthens trust signal.)
- Whistleblower process — should we engage an external ombudsman? (Currently counsel-only; revisit at scale.)
