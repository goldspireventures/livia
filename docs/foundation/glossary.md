# Glossary

**Status:** v1 (2026-05-07). Single source of truth for terms used across the foundation. Updated as new terms enter circulation.

## Strategic terms

- **The wedge.** The cell we ship v1 for: P2b solo Hair English-IE single-shop. Per F7 narrowing.
- **Heartland.** The cells that follow the wedge: P2a single-shop with Manager + chair-rental host + small chain Founder. Per v1.5 scope.
- **Cell.** A persona × configuration × vertical × locale combination. The atomic unit of product commitment. ~50 cells exist; we serve a chosen subset.
- **Operator-as-a-service.** The category we are claiming. An AI agent that runs the operational fabric of a service business, not a chatbot bolted onto scheduling software.
- **Trust amplification.** Bet 2. The architectural posture: every claim about safe handling of customer data is true at the architecture level. Audit log is the spine.
- **The hotel principle.** From `docs/personas.md` — the experience tenet every persona is judged against. (Quiet exacting Dublin hospitality apprenticeship — anticipate without performing.)
- **Liv learns from your last 90 days.** The first-week onboarding sprint where Liv ingests historical data + observes for a week before acting.

## Persona terms (per ADR 0009 + 0010 + `docs/personas.md`)

- **P1 Founder** — owns multiple shops; chain Founder.
- **P2a Owner-with-Mgr** — single-shop owner with Manager.
- **P2b Owner-no-Mgr** — single-shop owner without Manager (incl. solo / chair-rental host).
- **P3 Manager** — full administrative authority within a shop; reports to Owner.
- **P4 Senior-w-admin** — staff with scoped administrative authority (the role no incumbent has).
- **P5 Staff** — regular staff member.
- **P6 Receptionist** — front-desk role where present.
- **P7 Customer** — the end customer of the salon.
- **CT1–CT6** — customer typologies (Anonymous, Regular, New, Drift-target, Power-customer, Problem-customer).

## Role terms (per ADR 0009)

- **OWN** — Owner role; unlimited cap; full scope.
- **ADM** — Administrator (Manager); shop-scoped; cap-bound.
- **ADM-D** — Administrator-Designee (Senior-w-admin); team/scope-bound; cap-bound.
- **STA** — Staff.
- **REC** — Receptionist.
- **OWNER_HOST** — Owner of a chair-rental host (variant of OWN; v1.5).

## Configuration terms

- **C1 Solo mobile** — solo practitioner, mobile/no fixed location.
- **C2 Solo single-chair** — solo with one chair location.
- **C4 Single-shop owner+staff** — single-shop, ≤8 staff.
- **C5 Single-shop with mgr** — single-shop, 10–14 staff, Manager present.
- **C6 Single-shop mature with sr-w-admin** — like C5 with Senior-w-admin role.
- **C7 Multi-shop small chain** — 2–4 shops, single Founder.
- **C8 Multi-shop mid chain** — 5–9 shops.
- **C9 Multi-shop large** — 10+ shops.
- **C10 Chair-rental host** — host renting chairs to independent renters.
- **C11 Franchise** — franchisor + franchisees.
- **C12 Partnership** — multi-partner ownership.
- **C13 Multi-brand portfolio** — single Founder, multiple brand-shells.

## Modality terms

- **Visual** — owner cockpit, mobile, customer booking page, audit log surface.
- **Conversational** — WhatsApp, SMS, web chat.
- **Voice** — voice receptionist (per-tenant phone number).
- **Passive** — weekly digest, morning briefing, drift detection (Liv reaches out without explicit prompt).

## Rung terms (per `docs/livia-as-service.md`)

- **R1 Visible** — Liv exists; surfaces its state; user does the work.
- **R2 Concierge** — Liv drafts; user approves.
- **R3 Tag-team** — Liv handles routine; user handles novel.
- **R4 Trusted** — Liv proposes plans; user ratifies.
- **R5 Operator** — Liv runs the operational fabric; user reviews.

## Engineering terms

- **The runtime.** The per-tenant agent process per ADR 0012. Where Liv "lives."
- **The eval suite.** Golden datasets + online evals + auto-rollback class per ADR 0016.
- **The audit log.** Append-only hash-chained Postgres table per ADR 0015. The trust-amplification spine.
- **Kill-switch.** Permanent always-OFF flag for emergency disable. Per `docs/roadmap/feature-flags-and-rollout.md`.
- **The cap-bound ladder.** The refund authority chain: STA → ADM-D → ADM → OWN, each capped per role.
- **Scope.** What an ADM-D can act on (e.g., colour-team only, weekday only, ≤€50 only).

## Brand terms

- **Livia.** The company. The B2B brand.
- **Liv.** The agent. The character.
- **Aurora-Midnight.** The dark-only palette. Per ADR 0007.
- **Cormorant Garamond.** The serif anchor. Per design system.
- **The briefing.** The morning + Sunday digest surface; the ritual.
- **No-fly list.** Things Liv refuses to say + things Livia refuses to do. Per `docs/company/brand-of-livia-and-liv.md`.

## Workflow + feature terms

- **The refund ladder.** The cap-bound escalation workflow.
- **Owner-on-holiday handoff.** The temporary delegation workflow.
- **The Tuesday morning briefing.** The ritual in the demo flow + the daily briefing card.
- **"Liv was wrong" surface.** The rollback UX per ADR 0016.
- **Drift recovery.** Owner-controlled re-engagement with customers who haven't booked in a while.
- **The cross-tenant intelligence panel.** The differential-privacy-protected peer-set insights surface.

## Compliance + legal terms

- **DPA.** Data Processing Agreement per GDPR Art. 28.
- **DSR.** Data Subject Request (the customer's right to access/erase/port).
- **DPIA.** Data Protection Impact Assessment.
- **DPC.** Data Protection Commission (Ireland's GDPR supervisory authority).
- **EU AI Act high-risk.** The classification we treat ourselves as plausibly meeting.
- **k≥10.** The differential-privacy floor for cross-tenant intelligence.
- **Easy to leave.** The contract clause: day-1 full-fidelity export; pro-rata refund.

## Operational terms

- **Foundation audit.** Quarterly re-read of all foundation docs.
- **Eng demo.** Weekly 30-min eng show-and-tell.
- **Design-partner programme.** First-100 customer cohort with deep relationship.
- **Tuesday walks.** Founder shadow sessions in salons during normal operation.

## Things we don't say (per brand voice)

These are NOT terms in the glossary; they are banned. Listed here so engineers don't accidentally reach for them:
- AI-powered (we say "with Liv")
- Disrupt
- 10x, supercharge, ninja, rockstar, wizard
- Game-changer
- Synergy
- Leverage (verb)
- ROI as a verb
- Have a blessed day (Liv banned)
- "As an AI..." (Liv banned)
