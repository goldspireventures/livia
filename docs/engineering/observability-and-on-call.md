# Observability + on-call

**Status:** F8 (2026-05-07). Companion to ADR 0017.

## The question

Tracing, metrics, structured logs. SLA per surface. On-call rotation policy. Status page. Cost: who pays for Datadog vs self-host Grafana.

## The decision

**OpenTelemetry across all services; Grafana Cloud (managed, EU-hosted) for metrics + traces + logs; PagerDuty for on-call; status.livia.io for public status.** Captured in ADR 0017.

### Why Grafana Cloud (managed) over self-host

- EU-hosted option exists.
- Cost-efficient at our v1 scale.
- We don't yet have an SRE; managed removes the operational burden.
- Migration path: if we outgrow it, we self-host on the same OTel emitters.

### Why OpenTelemetry

- Vendor-neutral. Switching observability vendors doesn't require touching app code.
- Industry standard; on-call engineers from elsewhere already know it.

## SLO budgets per surface

Different surfaces have different SLAs; we don't promise the same number for the booking page (customer-facing, money-touching) as for the audit-log archive view (Owner-only, historical).

| Surface | Availability | p50 latency | p95 latency | SLO budget (mo) |
|---|---|---|---|---|
| Customer booking page | 99.95% | 200ms | 800ms | 21 min/mo |
| Voice receptionist | 99.9% | 400ms (first response) | 1.5s | 43 min/mo |
| WhatsApp inbound | 99.9% | 800ms (Liv response) | 3s | 43 min/mo |
| Owner cockpit | 99.5% | 600ms | 2s | 3.6 hrs/mo |
| Mobile app (active session) | 99.9% | 400ms | 1.5s | 43 min/mo |
| Audit log (recent 30d) | 99.5% | 500ms | 2s | 3.6 hrs/mo |
| Audit log (archive) | 99% | 5s | 30s | 7.2 hrs/mo |
| Cross-tenant intelligence rollup | 99% | 2s | 10s | 7.2 hrs/mo |

SLO breaches trigger automatic post-mortem RFC.

## On-call rotation

- **Year 1:** every engineer on call ~1 week in 6. No siloed ops team.
- **Coverage:** EU business hours hot; off-hours only for SEV1/SEV2 (customer-facing surfaces down).
- **Tooling:** PagerDuty primary; Slack secondary; phone tertiary.
- **Escalation:** primary → secondary (15 min) → on-call lead (30 min) → CEO/CTO (45 min).

### Severity classes

- **SEV1.** Customer-facing surface broken (booking page down, voice receptionist down, payments broken). Page immediately. Resolution-target: 30 min.
- **SEV2.** Owner-facing surface degraded (cockpit slow, cross-shop rollup broken). Page within hours. Resolution-target: 4 hrs.
- **SEV3.** Internal tool broken (eval pipeline failing, observability gap). File ticket; resolve within sprint.

### Post-mortems

Every SEV1 and SEV2 gets a post-mortem within 5 business days. Blameless. Lands as an RFC in `docs/postmortems/`. Includes: timeline, root cause, what we changed, what eval/SLO catches it next time.

## Status page

`status.livia.io` — public, honest, granular. Per-surface status (booking page, voice, WhatsApp, mobile, cockpit, audit log). Historical incidents. RSS + email subscribe. We publish incidents we caused; we don't paper over.

## Cost envelope

| Component | v1 monthly cost target |
|---|---|
| Grafana Cloud | ≤€800 |
| PagerDuty | ≤€300 |
| Status page (Atlassian Statuspage) | ≤€80 |
| Total observability | ≤€1,200/mo at ≤500 tenants |

Tracked weekly; reviewed monthly.

## What this earns us

A trustworthy operational posture from day 1. Status page transparency reinforces the trust-amplification brand. Per-surface SLOs let us be honest with customers about which surfaces we're staking our reputation on most.

## Open questions

- LLM provider observability — vendors have varying tracing depth. We instrument what we can and accept opacity where we must.
- Cost-per-tenant observability overhead. (Estimate: ≤€1.50/tenant-month at v1; tracked.)
