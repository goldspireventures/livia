# Incident response

**Status:** v1 (2026-05-07). Reads with `docs/engineering/observability-and-on-call.md` (ADR 0017), `docs/engineering/security.md`, `docs/policy/data-residency.md`.

## Severity classes

| Severity | Definition | Page | Resolution target |
|---|---|---|---|
| **SEV1** | Customer-facing surface broken (booking page down, voice receptionist down, payments broken). Money or trust at immediate risk. | Immediate (24/7). | 30 min to mitigation. |
| **SEV2** | Owner-facing surface degraded (cockpit slow, cross-shop rollup broken, audit log search slow). Trust impact, no money risk. | Within hours (business hours). | 4 hours. |
| **SEV3** | Internal tool broken (eval pipeline failing, observability gap). No customer impact. | File ticket. | Within sprint. |
| **SEV-SEC** | Security incident (suspected breach, unauthorized access, exposed credentials, vulnerability disclosure). | Immediate (24/7). | Containment + assessment within 4 hours; counsel + GDPR clock simultaneously. |

## Roles

- **Incident commander (IC).** On-call engineer; owns the incident; coordinates response; decides escalation.
- **Comms lead.** Posts to status page; communicates with affected customers; founder if SEV1+.
- **Scribe.** Maintains the timeline document for the post-mortem.

For SEV3, IC + scribe is the same person (the engineer who picked up the ticket).

## Response playbook (SEV1/SEV2)

1. **Acknowledge** in PagerDuty within 5 minutes.
2. **Assess** — confirm severity; identify affected surface(s) and tenant scope.
3. **Communicate** — status page update; internal Slack channel `#incident-active`; founder notification if SEV1.
4. **Mitigate** — kill-switch (per `docs/roadmap/feature-flags-and-rollout.md`), rollback (per `docs/engineering/release-pipeline.md`), or workaround. Goal: stop bleeding before perfecting fix.
5. **Resolve** — confirm restore; status page update; close incident ticket.
6. **Post-mortem** — within 5 business days; blameless; lands as RFC in `docs/postmortems/`.

## Response playbook (SEV-SEC)

1. **Contain** — immediate access revoke; system isolate if needed; do not destroy evidence.
2. **Assess scope** — what data was at risk; what data was accessed; how many tenants/customers affected.
3. **Notify counsel** — within 1 hour for any suspected breach.
4. **GDPR clock** — 72-hour notification clock starts at the moment of awareness; per Art. 33 we notify the data protection authority + affected controllers (the tenants themselves) if the breach is "likely to result in a risk."
5. **Customer notification** — controllers (tenants) notify their customers per Art. 34 if high-risk; we provide template + data per `docs/policy/data-residency.md`.
6. **Public disclosure** — if we caused it, we disclose on `status.livia.io` + blog within 7 days unless counsel directs otherwise.
7. **Post-incident review** — extended post-mortem with counsel; root cause; policy/architecture changes; published to team within 30 days.

## Status page conventions

`status.livia.io`:
- Per-surface status (booking page, voice, WhatsApp, mobile, cockpit, audit log).
- Update at incident start, every 30 min during, at resolution.
- Honest language. "We are investigating reports of degraded voice receptionist response times in IE customers" — not "Some users may be experiencing minor issues."
- Historical incidents preserved.

## Customer comms playbook

| Audience | Channel | Trigger |
|---|---|---|
| All affected tenants | Status page subscribers (email + RSS) | SEV1 in progress |
| Specific tenants impacted | Direct email from CS | SEV1/SEV2 with tenant-specific impact |
| Design partners | Direct WhatsApp from founder | Any incident affecting them |
| Public | Blog post | Post-incident; SEV1 retrospective; SEV-SEC always |

We never minimise. We never blame the customer. We never blame a vendor in public without counsel review.

## Post-mortem template

Lives at `docs/postmortems/README.md`; copied per incident.

Sections:
- **Summary** (2 sentences).
- **Timeline** (timestamps, actors, actions).
- **Impact** (tenants affected, customers affected, money lost or at-risk, trust impact).
- **Root cause** (technical + organisational).
- **What went well**.
- **What didn't**.
- **Action items** (owners + due dates; tracked).
- **Eval / SLO catch** (what eval signal or SLO would have caught this earlier).

## Drills

- **Quarterly:** kill-switch drill. On-call engineer practices triggering each kill-switch from `feature-flags-and-rollout.md`.
- **Quarterly:** rollback drill. Practice rolling back a deploy in <5 min.
- **Annually:** SEV-SEC drill. Tabletop with counsel + ops + founder.
- **Annually:** disaster recovery drill. Restore from backup to staging.

## When the LLM is broken

- Liv runtime degrades per ADR 0012 (graceful degrade per surface).
- Page on-call only if degraded for >15 min (LLM blips are common; auto-fallback handles short outages).
- If LLM provider is fully down: switch to fallback provider (a second model from a different provider, kept warm) within 30 min.
- Communicate on status page if degraded >30 min.

## On-call handoff

- Daily 11:00 CET handoff (10 min, async via written notes in handoff doc).
- Open SEV1/SEV2 explicitly transferred with IC role.
- Outgoing on-call writes "what to watch" notes.

## Escalation

- Primary on-call → secondary on-call (15 min if no ack).
- Secondary → on-call lead (30 min if no progress on SEV1).
- On-call lead → CTO/CEO (45 min if SEV1 unresolved).
- CEO → counsel (any SEV-SEC, immediately).

## Open questions

- Should we have an automated incident draft from Sentry SEV1 alerts? (Currently manual — tradeoff against false positives.)
- Should design-partner Slack channel get faster updates than public status page? (Currently same.)
