# Hiring plan — F10

**Status:** F10 (2026-05-07). Derived directly from F3 depth-per-persona commitments, F8 engineering blueprint, F9 sales motion.

## The depth-map IS the hiring plan

The most-overlooked input: the rung commitment per persona drives team shape. Rung 5 for P2b solo + Rung 3–4 for P1/P2a Owners + 24/7 voice receptionist + concierge migration for first 100 customers requires a specific team. Most founders only realise this 100 customers in, when they're drowning. We won't.

## First 5 hires (months 0–6)

These are the founding-team hires, named by role + profile + comp band + when.

### Hire 1 — Backend engineer (agent runtime focus)
- **When:** Month 0–1. Co-founder or first hire.
- **Profile:** 5+ yrs backend; LLM-app experience; comfortable with Postgres, OpenTelemetry, Inngest. EU-based.
- **Comp:** €80–110k base + meaningful equity (1–3%).
- **Owns:** `packages/liv-runtime/`, ADR 0012 implementation, agent runtime fleet.

### Hire 2 — AI engineer (eval + guardrails)
- **When:** Month 1–2.
- **Profile:** 3+ yrs ML/eval engineering; experience with LLM eval suites (e.g., promptfoo, custom); strong on PII redaction + prompt safety.
- **Comp:** €75–100k base + 0.5–1.5%.
- **Owns:** `packages/liv-evals/`, ADR 0016 implementation, golden datasets, online eval pipeline.

### Hire 3 — Concierge ops lead (migrations + design-partner support)
- **When:** Month 2–3 (in time for design-partner programme launch).
- **Profile:** Salon industry insider OR ex-Phorest CS OR strong EU SaaS CS; calm; detail-oriented; salon-fluent.
- **Comp:** €55–75k base + 0.25–0.75%.
- **Owns:** Phorest data export broker concierge process, design-partner weekly cadence, first-100 onboarding.

### Hire 4 — Design lead (cross-platform, brand + product)
- **When:** Month 2–4.
- **Profile:** 5+ yrs product design; mobile + web; brand sensibility; EU portfolio preferred.
- **Comp:** €75–100k base + 0.75–1.5%.
- **Owns:** `packages/ui/`, `docs/engineering/design-system.md`, brand-of-Liv visual, marketing site visual.

### Hire 5 — Mobile engineer (Expo flagship)
- **When:** Month 3–5 (when mobile becomes the bottleneck).
- **Profile:** 4+ yrs mobile; Expo + RN; design-conscious; ships polish.
- **Comp:** €70–95k base + 0.5–1%.
- **Owns:** `artifacts/livia-mobile/`, ADR 0008 implementation, mobile motion + materiality.

## Org chart at 10, 25, 50

### At 10 (months 6–12)
- 2 founders (CEO/product, CTO/eng)
- 5 above
- +1 ops engineer (on-call + observability)
- +1 content / DevRel (marketing site, copy, design-partner content)
- +1 founding sales / accounts (Stage 2 motion)

### At 25 (months 12–18)
The 10 above, plus:
- +3 backend engineers (workflow engine maturity, multi-tenant graduation, payments depth)
- +2 AI engineers (locale expansion, voice quality, eval scale)
- +2 mobile/web engineers
- +1 designer (component library + per-locale visual)
- +2 CS (Stage 3 motion)
- +1 SDR
- +1 finance/ops
- +1 head of engineering (Hire 1 may step into this)
- +1 head of CS

### At 50 (months 18–30)
The 25 above, plus:
- +5 engineers across product / platform / AI
- +3 designers across surfaces + locale
- +2 ops/SRE
- +3 CS
- +2 SDR / 2 closers (sales team)
- +1 head of marketing
- +1 head of people
- +1 finance lead
- +1 legal lead (EU regulatory specialist)
- +remaining founder seats

## What we never outsource

- **Liv's character.** In-house. Brand-of-Liv stewards (founder + design lead + content lead).
- **Eval data labelling.** In-house at least until 1000 tenants. The labelling teaches us what Liv is doing.
- **Ops on-call.** In-house. Engineers rotate; ops competence is a whole-team competence (per principle 8).
- **Customer success for first 100.** Founder + concierge ops lead. Hand to team only after motion is repeatable.

## What we DO outsource

- Legal counsel (EU regulatory firm; per-market local counsel).
- Accounting (EU SMB accountancy firm).
- Payroll (Deel or similar, EU-friendly).
- Design system illustration (commissioned; not in-house artist on team).
- Localisation translation of UI strings (managed translation pipeline; NOT Liv's voice — that's in-house per locale).
- Penetration testing (annual external).
- HSM key custody (managed cloud HSM provider).

## Hiring principles

- **Documentation-first interviews.** Candidates submit a written take-home rather than a whiteboard live-code (respects async-first culture; selects for the writing the role requires).
- **EU-anchored hiring.** All hires must be eligible to work in EU/UK without visa sponsorship in year 1 (cost + speed). Year 2: visa sponsorship for senior strategic hires only.
- **No 10x talk.** No "rockstars", "ninjas", "wizards". We hire for craft + judgment + calm.
- **Diverse by default, not by tokenism.** Sourcing from networks beyond founder networks; structured interviews; calibrated rubrics.
- **References matter.** Two references minimum; back-channel checks for senior hires.

## What this earns us

A team shaped by the depth commitments we've already made — not by reaction-to-emergency. The hire sequence funds itself: Hire 1 + 2 ship the runtime that lets us sign 50 customers; those 50 fund Hire 3 + 4 + 5; the next 200 fund the next-15.

## Open questions

- Founder's-own-time allocation through month 12 — sales (heavy) vs product (heavy) vs people (heavy)?
- When does the first non-founding sales hire become a closer vs an SDR?
