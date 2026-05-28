# Livia Inc — internal onboarding (employees & contractors)

**Status:** v1.0 (2026-05-21)  
**Audience:** anyone joining Livia with production-adjacent access  
**Not:** salon owner onboarding (see [`../product/LIVIA-COMPLETE-SYSTEM-SPEC.md`](../product/LIVIA-COMPLETE-SYSTEM-SPEC.md) §3)

---

## Week 0 — Before access

- [ ] Signed: code of conduct, IP assignment (`docs/governance/`)  
- [ ] MFA enabled on Google Workspace  
- [ ] Read: [`data-residency.md`](../policy/data-residency.md), [`access-control.md`](../policy/access-control.md)

---

## Week 1 — Safe development

| Day | Task |
|-----|------|
| 1 | Clone repo; `docs/LOCAL_DEV.md`; run api + dashboard locally |
| 2 | Read [`foundation/README.md`](../foundation/README.md) F7→F3; [`LIVIA-RESILIENCE-OPS-AND-TRUST.md`](../product/LIVIA-RESILIENCE-OPS-AND-TRUST.md) §4 logging |
| 3 | Clerk **dev** only — no prod keys on laptop |
| 4 | Open PR with naming check; read ADR 0002, 0009, 0015 |
| 5 | Shadow support: read [`support-runbook.md`](./support-runbook.md) cases 1–3 (staging) |

---

## Week 2–4 — Operations literacy

| Role | Extra |
|------|-------|
| **Engineering** | `incident-response.md`, on-call shadow, Sentry project tour |
| **Product** | `marketing-vs-reality.md` Monday review, Experience Bible |
| **CS (future)** | Internal portal (when live); tickets API; no break-glass until L2 |

---

## Production access rules

| Access | Default |
|--------|---------|
| Production DB | **None** |
| Production logs / Sentry | Eng + founder |
| Stripe production | Founder + finance |
| Break-glass | Co-approve; 60 min; owner notified 24h |

---

## Offboarding

- [ ] Revoke Clerk, Stripe, Grafana, PagerDuty, Supabase within 4h  
- [ ] Rotate any shared secret they could have seen  
- [ ] Audit log review for `livia-staff` actor rows in last 30d  

---

## Questions new hires should ask

1. What SEV would my feature break if it failed?  
2. Where is `tenant_id` in logs for this route?  
3. Is this mutation gated at the service layer, not just UI?  
4. What is the rollback plan for my deploy?
