# Operating principles — F10

**Status:** F10 (2026-05-07). Reads with `docs/operating-cadence.md`, `docs/engineering/principles.md`.

## How decisions get made

### Three classes of decision

| Class | Examples | Process |
|---|---|---|
| **Category-shaping** | Pricing model, market expansion order, new persona commitment, brand voice changes | Founder-driven. Founder writes RFC. Team comments. Founder signs. |
| **Architectural / strategic** | New ADR. New package. Workflow definition. Eval framework changes. | RFC-driven. Author writes; relevant team reviews; head-of-area signs. ADR published. |
| **Tactical / executional** | Bug fixes, single-feature work, copy changes within voice, test additions | PR-driven. PR + review + merge. |

Founder-veto applies to category-shaping and to ADRs that contradict the foundation docs. Veto is rare and requires written reasoning.

## Async-first

- Documentation-first. RFCs and ADRs precede code.
- Standups: written. End of day, you write what you shipped + what's next + what's blocked.
- Synchronous time is reserved for: design-partner interviews, weekly eng demo, monthly roadmap review, quarterly foundation audit, founder 1:1s, and emergencies.
- Email is for external. Slack is for ephemeral. Documentation is for durable.

## Cadence

| Cadence | What |
|---|---|
| **Daily** | Written standup. Async. ~5 min. |
| **Weekly** | Eng demo (30 min, recorded, every engineer ships ONE thing). Design-partner interviews (rotation; ≥3 per week through Stage 2). |
| **Bi-weekly** | Eval review meeting (30 min). |
| **Monthly** | Roadmap review (60 min). Customer council (Stage 3+). |
| **Quarterly** | Foundation audit — re-read `docs/foundation/*`, `docs/engineering/*`, `docs/business/*`, `docs/company/*` top to bottom. Stale claims retired; new claims RFC'd. |
| **Annually** | All-hands offsite (3 days, EU venue). Roadmap year-ahead. Brand audit. |

## Kill-switch culture

Every feature ships with a documented retire-condition. We retire features as confidently as we ship them. Examples of retire-conditions that should be in every feature RFC:

- "Retire if usage <X per cell after 90 days."
- "Retire if Owner satisfaction drops below baseline in cells where it's enabled."
- "Retire if a competitor commoditises this and our differentiation moves elsewhere."
- "Retire if the feature blocks the next-rung promotion (R2 → R3) for the persona it serves."

The bar to ship is the same as the bar to retire. Both are RFC moments.

## Public-by-default within the company

- All RFCs, ADRs, post-mortems, retros, customer interviews (with consent) are visible to every employee.
- Sensitive material (compensation, individual performance, legal pre-decision) is restricted; everything else is open.
- Founders' calendars visible to everyone.

## EU-anchored, remote-friendly

- HQ: Dublin (legal + brand anchor).
- Hubs: any EU city where ≥3 employees concentrate (currently Dublin only; expect Berlin or London at ~10 hires).
- Remote-default; in-person quarterly per hub; annual all-hands EU offsite.
- Working hours: core overlap 11:00–15:00 CET. Outside that, everyone owns their schedule.
- No US-tied vacation policy; statutory European leave + 5 days additional.

## On-call posture

- Every engineer ~1 week in 6 (year 1).
- Off-hours only for SEV1/SEV2 (per ADR 0017).
- Comp time + on-call stipend for the rotation.
- No "macho on-call" culture; pages outside SEV1 hours that turn out to be SEV3 are a process bug we fix.

## How we handle disagreement

- **Disagree-and-commit** is the default once the decision-maker decides.
- **Veto-with-reasons** is available to anyone if they believe a decision contradicts the foundation docs. The veto goes to the founder; founder either over-rides or sustains.
- **Permanent dissent** is logged in the RFC. We don't pretend agreement we don't have; we move forward with the dissent recorded.

## How we handle mistakes

- Blameless post-mortems on SEV1/SEV2 within 5 business days.
- Mistakes in customer-facing surfaces are owned publicly (status page; sometimes blog).
- Mistakes in internal process are RFC'd and the RFC explicitly fixes the process so the mistake's class doesn't recur.
- Repeated mistakes of the same class indicate a system bug; we fix the system, not the person.

## What we never do

- Surveillance management. We don't monitor keystrokes, mouse activity, screen time.
- Stack-rank reviews. Annual reviews are forward-looking calibration, not Darwinian.
- Crunch culture. The product is built over years; we don't sprint to burnout.
- Performative office time. Async-first; in-person is for collaboration, not theatre.

## What this earns us

A culture that matches the product. Liv is calm, present, deliberate; Livia (the company) is calm, present, deliberate. The brand and the operating culture are the same posture.
