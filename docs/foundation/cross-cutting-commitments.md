# Cross-cutting commitments — engineering ↔ business ↔ company alignment

**Status:** v1 (2026-05-07). The bridge document. Demonstrates that depth-per-persona commitments → engineering capacity → hires → release scope → pricing line up. If they don't line up, this doc surfaces the gap.

## The alignment matrix

Each row = a strategic commitment. Each column = the discipline that has to deliver against it.

| Commitment | Strategic source | Engineering implication | Hiring implication | Release version | Pricing implication |
|---|---|---|---|---|---|
| Liv runs the operational fabric for P2b solo at R5 by year-end of v1 | F3 personas v2 + F7 bets | Per-tenant runtime (ADR 0012); persistent context; voice integration; cost ≤€8/mo | Hire 1 (backend, runtime); Hire 2 (AI eval) | v1 | Solo €79/mo + voice 4% recovery |
| P1 Founder × C7 chain at R3-R4 | F3 + F5 chain journey | Cross-shop rollup; staff-borrow workflow; chain briefing | v1.5 hires (3 backend) | v1.5 | Chain €249/shop |
| Audit log as product surface | F7 Bet 2 + F8 ADR 0015 | Append-only Postgres; hash-chain; daily tip-hash signing; Owner read UI | Concierge ops lead (audit-drill prep); Hire 4 (design — audit UI) | v1 | Included; never an upsell |
| Cross-tenant intelligence with k≥10 | F8 ADR 0014 | Differential privacy aggregator; opt-in flow; peer-set formation | Hire 2 deep work; ops engineer for nightly rollup workflows | v1 (scaffolding) → v1.5 (real insights) | €49/mo add-on (opt-in) |
| Voice receptionist en-IE | F7 wedge | Twilio + voice runtime + per-tenant number; eval golden set en-IE | Hire 2 + Hire 3 (concierge for voice setup) | v1 | 4% outcome share, monthly digest cap per plan |
| Voice in second locale | F9 expansion | Per-locale character + corpus + eval set; per-locale TTS cast (~€60k/locale) | +1 AI engineer for v2 | v2 (en-UK) → v3 (de-DE, fr-FR, etc.) | Per-locale add-on €29/mo |
| Phorest data export broker | F6 switching aid | XL engineering (broker + reconciliation); ops process | Hire 3 concierge | v1 | Free for design partners; €500–€2,500 thereafter |
| Chair-rental data model | F7 wedge config | New entities (chair_rentals, rent_invoices); host dashboard; rent automation | v1.5 hire (1 backend, 1 design) | v1.5 | Host €99 + €19/renter/mo |
| Multi-brand portfolio | F7 wedge config | Brand-shell isolation; brand-wall guarantees; per-brand briefing | v1.5 hire (1 backend) | v1.5 | €99/brand-shell + tier per shell |
| EU AI Act high-risk posture | F9 regulatory | Eval suite at scale (ADR 0016); audit log (ADR 0015); guardrail layer; doc tree as technical documentation | Counsel (outsourced); +1 legal lead at v3 | v1 (built); v3 (formal compliance evidence pack) | Included; never an upsell |
| Trust-amplification brand | F7 manifesto + F10 brand | Audit log surface; "Liv was wrong" UX; transparent status page; honest disclosure | Brand stewards (founder + design + content) | v1 (continuous through v3) | Earned, not priced |
| Mobile flagship | ADR 0011 | Expo app; native goodies (Live Activities, widgets, offline reads, biometrics, push, haptics, location); cross-platform UI library | Hire 5 (mobile engineer) | v1 (per `mobile-roadmap.md` Phases A–D) | Included in all tiers |
| Concierge migration for first 100 customers | F9 design partners | Phorest broker + concierge process + 30-day parallel-run reconciliation | Hire 3 (concierge ops) | v1 | Free for design partners; included in pricing |
| SOC 2 Type 1 | F9 GTM Gate 3 | Eval suite + audit log + observability + access control + policy docs | External auditor (outsourced) | v1 (kicked off at Gate 3) | Enterprise-tier evidence; not retail-priced |
| SOC 2 Type 2 | F9 enterprise scope | Sustained operation evidence | External auditor | v3 | Enterprise tier (negotiated) |
| Per-tenant cost envelope held | F8 principle 7 | Cost tracking per tenant; weekly review; alarm + RFC on busts | Ops engineer (year 2) | v1 (continuous) | Underwrites pricing model viability |

## Alignment health checks (quarterly foundation audit reviews these)

### Engineering capacity vs commitments

| Quarter | Commitments due | Engineering hires landed | Capacity ratio | Decision |
|---|---|---|---|---|
| Q3 2026 | v1 build (per `release-calendar.md`) | Hires 1+2 + founder | Tight | OK; founder code-time |
| Q4 2026 | v1 ship | + Hires 3+4+5 | Adequate | OK |
| Q1–Q2 2027 | v1 → v1.5 | +3 backend, +1 design | Comfortable | OK |
| Q3–Q4 2027 | v2 build | +2 AI, +2 mobile/web | Stretched | Needs Hire 6+7 confirmed |
| Q1–Q2 2028 | v2 ship | +25 person team | OK if hiring on track | Watch closely |
| 2028+ | v3 | 50-person team | Speculative | Quarterly recalibration |

### Pricing vs F6 economics

| Cell | Pricing (annual) | F6 measurable Liv-value (annual) | Implied ROI | Health |
|---|---|---|---|---|
| P2b Conor solo | €1,212 + voice share | ~€30,000 | 25× | Strong |
| P2a Roisín 14-staff | €3,684 | ~€18,000 | 5× | Healthy |
| P1 3-shop chain | €13,464 | ~€55,000 | 4× | Healthy |
| P2b chair-rental host (4 renters) | €2,340 | ~€34,000 | 14× | Strong |

If any row drops below 3× over time, pricing-model RFC.

### Brand vs product claims (marketing-vs-reality)

`docs/audits/marketing-vs-reality.md` audited at every Gate. Zero rows in `build-before-G3` is a Gate 3 acceptance criterion. This audit + this cross-cutting doc are the two anti-drift mechanisms.

## What this doc forces us to confront

- **Every commitment costs hiring + engineering + version slot + pricing room.** Adding a commitment without acknowledging the four costs is how product strategy turns into delusion.
- **If a commitment doesn't fit a version, it's deferred or the version is delayed.** Per `release-calendar.md` cancellation conditions.
- **If a commitment doesn't have an engineering owner, it's not real.** Doesn't matter how often it's repeated in marketing.
- **If pricing doesn't reflect the cost of a commitment, the commitment is unsustainable.** F6 economics → F9 pricing must close.

## Cadence

This doc is updated at every quarterly foundation audit. New commitments require RFC + this doc updated atomically.

## Open questions

- Should there be a "commitment debt" indicator — like tech debt, but for promises that outran their hiring/engineering backing? (Probably yes; revisit at v1.5.)
- The "trust-amplification brand" row is hard to quantify. Should we attempt a proxy metric (NPS attribution to trust)? (Currently no — the brand outcome is whole-product; revisit.)
