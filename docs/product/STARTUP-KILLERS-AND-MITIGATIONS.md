# Startup / product killers — and Livia mitigations

**Status:** v1.0 (2026-05-21) — wired into Phases 1–8 + Track C  
**Research basis:** common SaaS failure modes (CB Insights patterns, operator lore, EU trust context)

| Killer | How it kills Livia | Build-plan mitigation |
|--------|-------------------|------------------------|
| **No one feels the pain** | Nice tech, wrong wedge | EU appointment businesses only; Liv on phone/booking |
| **Onboarding cliff** | Sign up → empty app → churn | Phase 2 wizard A1–A12 + seed packs |
| **Marketing lies** | Trust destroyed at first login | `marketing-vs-reality` + Phase 1 honest copy |
| **Silent failures** | Owner discovers disaster late | Phase 5 rollback + Phase 6 Help + audit |
| **No support path** | Anger → public reviews | Support tickets API + Help UI |
| **Payments confusion** | Chargebacks, founder time | Phase 4 Billing vs Connect separation |
| **Security incident** | Company-ending in EU | Track C SEV-SEC + access-control |
| **Single founder bus factor** | Ops stops | Runbooks, internal onboarding, portal |
| **No observability** | Debug = guesswork | pino contract + Sentry + R1 |
| **Scope sprawl** | Never ships | v1-scope + EU lock in Complete Spec |
| **Weak RBAC** | Data leak headline | requireRole + R1 route tests |
| **Churn after trial** | No habit loop | Reminders, My Day, Liv value metrics |
| **Competitor parity chase** | Commodity | OS + Liv agent, not calendar clone |

Phases 1–8 explicitly address killers in **bold** rows above.
