# SOC 2 Type 1 — kickoff checklist (Gate 3)

**Status:** v0.1 (2026-05-20)  
**Owner:** founder + engineering  
**Gate:** Public launch (`docs/launch-plan.md` Gate 3)

This is the **engagement-ready** checklist before signing with Vanta, Drata, or Secureframe. It does not replace an auditor scope letter.

---

## 1. Evidence already in the repo

| Control theme | Livia artifact |
|---------------|----------------|
| Access control | Clerk auth, RBAC (`requireRole`), internal ops secret (`INTERNAL_OPS_SECRET`) |
| Audit trail | Hash-chained `audit_log`, owner search UI (`/audit`) |
| Change management | GitHub PR + CI (`typecheck`, codegen, eval, api tests, naming taboo) |
| AI transparency | `lib/ai-disclosure`, voice/SMS/email/chat surfaces |
| Data minimisation | Tenant-scoped queries, impersonation read-only + `human.persona.view` |
| Incident response | `docs/engineering/incident-response.md` |

---

## 2. Pre-kickoff actions (founder)

- [ ] Select GRC vendor (Vanta / Drata / Secureframe) and sign engagement letter
- [ ] Scoping call scheduled (Type 1 point-in-time)
- [ ] Production region documented (EU — `docs/adr/0018` / business `euRegion`)
- [ ] Subprocessor list current (Anthropic, Clerk, Stripe, Twilio, Resend, Supabase/Postgres host)
- [ ] DPA + ToS + Privacy counsel review scheduled (`launch-plan` C6/C7)

---

## 3. Engineering pre-kickoff (week of kickoff)

- [ ] `scripts/deploy-migrate.sh` run on staging + production after each deploy
- [ ] Sentry projects tagged with release SHA (E2)
- [ ] Backup / restore drill for Postgres (document RPO/RTO in `.local/` runbook)
- [ ] Access review: who has production DB, Stripe, Clerk, Twilio dashboards
- [ ] Enable MFA on all vendor consoles

---

## 4. Type 1 observation window (typical 2–4 weeks)

- [ ] No P0 incidents during observation (see SEV definitions)
- [ ] Sample of 5 tenant audit log exports for auditor
- [ ] Sample change ticket ↔ PR link for 3 releases
- [ ] Penetration test or automated DAST summary (optional for Type 1, recommended)

---

## 5. Out of scope for Type 1 (defer Type 2)

- Continuous control monitoring automation
- Formal vendor SOC report collection for every subprocessor
- 24/7 on-call rotation evidence

---

## Document control

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-05-20 | Phase 9 kickoff scaffold |
