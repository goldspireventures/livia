# Policy — Cross-tenant intelligence

**Status:** v1 (2026-05-07)
**Anchors:** ADR 0014 (multi-tenant isolation hybrid + cross-tenant intelligence default opt-in with k≥10 differential privacy), `docs/features/cross-tenant-intelligence.md`.

## Posture

Cross-tenant intelligence (peer-set insights — "salons in Dublin like yours saw bookings increase 15% the week after Mother's Day") is an **opt-in capability** with **k≥10 differential-privacy floor** + per-tenant control + per-Owner approval surface.

The default is OFF. Tenants opt in; they may opt out at any time.

## What constitutes cross-tenant intelligence

- Peer-set aggregates: "salons in Dublin in your size bracket booked X" (size + geography + vertical aggregation).
- Benchmark insights: "your no-show rate is N% above the peer median" (only if peer-set has k≥10 + opt-in).
- Operational signals: "peer-set saw a spike in cancellations on date X — possibly weather-related" (aggregate only).
- Vertical insights: "Hair vertical voice-receptionist booking conversion peaked at 14:00 in IE in Q4."

## What is NOT cross-tenant intelligence

- Tenant-specific data shared with another tenant (forbidden; cross-tenant leak).
- Tenant-identifiable patterns (e.g., "the salon at 12 Pearse St had X" — never).
- Customer-identifiable cross-tenant data (the customer is the tenant's; they belong to the salon per Bet 5; never shared).
- Comparative individual-tenant rankings ("you're #3 in Dublin").
- Anything that could be reverse-engineered to identify a single tenant or customer.

## Privacy floors

| Floor | Value | Rationale |
|---|---|---|
| **k-anonymity** | k ≥ 10 (peer-set must contain ≥10 opted-in tenants before any aggregate publishes) | Industry-standard practice; ADR 0014 |
| **ε-differential privacy** | ε = 1.0 per published metric per quarter | Conservative; ADR 0014 |
| **Time gap** | Insights published with ≥7-day lag from underlying data | Mitigates point-in-time inference |
| **Geographic granularity** | City-level minimum (not street-level); region-level for cells with limited density | Standard re-identification mitigation |
| **Vertical granularity** | Vertical + size-bracket; never single-shop-identifiable | Standard |

If a peer-set falls below k=10 (opt-outs reduce membership), publication ceases until k restored.

## Opt-in flow

Owner-only (OWN role; not delegable):
1. Settings → Cross-tenant intelligence.
2. Read explanation: what data, what aggregation, how protected, how to opt out.
3. Tick "I understand and opt my tenant in."
4. Tenant joins relevant peer-sets per its vertical + size + geography.
5. Tenant gains access to peer-set insights (Settings → Insights surface).
6. Audit log entry.
7. Owner email confirmation.

## Opt-out flow

- Same surface; one click.
- Effective immediately; aggregates exclude this tenant from next publication cycle.
- Insights surface restricted (can no longer view).
- 30-day opt-out cooldown before opt-in again (anti-toggle abuse).
- Audit log entry.

## What aggregates publish

- Booking volume trends (per peer-set, per week, smoothed).
- No-show rate quartiles (per peer-set, per quarter).
- Voice-receptionist conversion benchmarks (per peer-set, per locale).
- Refund-rate quartiles (per peer-set, per quarter).
- Average booking value quartiles (per peer-set).
- Seasonal patterns (per peer-set, year-over-year, smoothed).

## Owner consent versioning

When the policy materially changes (e.g., adding a new aggregate type), all opted-in tenants re-consent before exposed to the new aggregate.

## Per-tenant control

- Tenant can mark specific data classes excluded from aggregation (e.g., "include my booking volume but not my refund rate").
- Tenant can mark specific peer-sets excluded (e.g., "I don't want to share with the Dublin Hair peer-set; only with the IE-wide one").
- Audit-logged.

## Pricing

- Cross-tenant intelligence is a €49/mo add-on at v1.5.
- The underlying privacy infrastructure (the differential-privacy aggregator + the peer-set publication pipeline) costs Livia in engineering; the add-on prices that.
- Tenants who opt in but don't pay (during v1 scaffolding period) get scaffolded insights for free — actual insights available only after add-on purchase at v1.5.

## Failure modes

- **Aggregator bug published a tenant-identifiable metric.** SEV-SEC. Containment + counsel + per-affected-tenant disclosure within 24h + post-mortem.
- **k drops below 10 unnoticed.** Publication pipeline auto-pauses on every k-check; alarms on pause.
- **Opt-out request not honoured.** Within-policy SLA: 7 days. Failure = SEV2 + tenant disclosure + audit-log review.

## Vendor exposure

The aggregator runs in our EU compute. No third-party vendor (Anthropic, etc.) sees pre-aggregation data.

## Annual review

Reviewed annually + on substantive policy change. Last review: 2026-05-07. Next: 2027-05.

## Open questions

- Should we publish a transparency report on cross-tenant intelligence (counts of peer-sets, opt-in rates)? (Currently no; revisit at v1.5.)
- Should ε be per-publication or per-quarter-per-metric? (Currently per-metric; revisit per privacy literature.)

## EU/IRE residency

The aggregator runs in EU compute; aggregates retained EU-region; no data leaves EU at any stage.
