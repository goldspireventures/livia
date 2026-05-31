# Livia — Documentation readiness (levels, POVs, verdict)

> **⚠ Superseded (2026-05-31)** by [`LIVIA-DOCUMENTATION-PROGRAM.md`](./LIVIA-DOCUMENTATION-PROGRAM.md). Build is paused until gate **G-DOC**. The verdict below reflects May 2026 beta — not the full doc sprint target.



**Status:** v1.1 (2026-05-21) — post close-out pass  

**Purpose:** Answer “what levels exist beyond spec?”, “what POVs are we missing?”, and **are ALL docs ready before build?**  

**Build authority:** [`LIVIA-DETAILED-BUILD-PLAN.md`](./LIVIA-DETAILED-BUILD-PLAN.md) · **Deferred only:** [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md)



---



## 1. Documentation maturity ladder (seven levels)



| Level | Name | What it means |

|-------|------|---------------|

| **L0** | Intent | Why we exist; bets; positioning |

| **L2** | **Specification** | Unambiguous product/ops truth |

| **L3** | **Design** | Screen cards, copy, states |

| **L4** | **Contract** | OpenAPI, `@workspace/policy`, ADRs |

| **L5** | **Implementation** | `artifacts/*` |

| **L6** | **Verification** | Playwright, audits |

| **L7** | **Operations** | Runbooks, SOPs |



[`LIVIA-COMPLETE-SYSTEM-SPEC.md`](./LIVIA-COMPLETE-SYSTEM-SPEC.md) remains **L2 complete** for EU OS scope.

**Liv OS intelligence (L2, 2026-05-21):** [`LIV-OPERATING-SYSTEM.md`](./LIV-OPERATING-SYSTEM.md) — policy graph, tool registry target, internal JARVIS, per-actor behaviour, event matrix, gap vs code. **Implementation still L5-spine** (2 tools); build against OS spec, not the old matrix alone.



---



## 2. POVs — updated verdict



| POV | L2 | L3 | L5 | L7 | Notes |

|-----|----|----|----|-----|-------|

| **Prospect** | ✅ | ✅ pages | ✅ marketing | — | pricing, how-it-works, verticals, status |

| **Owner (P1)** | ✅ | ⚠️ 6 cards | ✅ wizard | ✅ runbook | Full 100 cards deferred |

| **Livia Inc L1/L2** | ✅ | — | ✅ portal MVP | ✅ triage SOP | Not workforce SSO |

| **Customer (P7)** | ✅ | ⚠️ | ✅ public book + chat | — | Connect prod = G3 |

| **Legal** | ⚠️ draft | — | — | — | **G3 only** — see OPEN-ITEMS |

| **Engineering** | ✅ | — | ✅ Phases 0–6 core | ✅ staging + DR | MASTER-BUILD §1 refreshed |



---



## 3. Verdict



### Short answer



**Phases 0–6 product build: doc-gated and code-complete for EU beta.**  

**Not “every F10 doc at L5”** — screen cards, counsel legal, G2/G3 ops remain.



### Ready to build against ✅



EU Complete Spec, ADRs, OpenAPI, policy, workflows, resilience doc, support runbook, feature triage SOP, BUSINESS-RULES-REGISTRY.



### Explicitly deferred (not open — closed as “won’t do in repo now”)



See [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md): counsel, stores, 10 real shops, Figma, full screen-card grid. **WhatsApp / Instagram / Messenger:** shipped — [`CHANNELS-EU-MESSAGING.md`](./CHANNELS-EU-MESSAGING.md).



---



## 4b. Resilience & ops



| Topic | Ready? |

|-------|--------|

| Failure modes | ✅ `LIVIA-RESILIENCE-OPS-AND-TRUST.md` |

| Log correlation | ✅ |

| DR RPO/RTO | ✅ targets in `disaster-recovery.md` (verify Supabase plan) |

| Internal onboarding | ✅ |

| RBAC | ✅ persona matrix test; route supertest = R1 optional |

| Feature triage | ✅ `feature-triage-sop.md` |

| Staging | ✅ `staging-environment.md` |

| Onboarding stuck | ✅ cron + Resend nudge |



---



## 5. Checklist (repo-closeable items)



- [x] Documentation levels — §1  

- [x] Business rules registry  

- [x] Support runbook  

- [x] Feature triage SOP  

- [x] OpenAPI `/support/tickets`  

- [x] Resilience doc  

- [x] DR RPO/RTO filled (verify with provider)  

- [x] RBAC persona smoke test  

- [x] Per-vertical demo seed spec — `PER-VERTICAL-DEMO-SEED.md`  

- [x] Hours-to-payroll — RFC 0012 deferred  

- [x] DATA-SUBJECT-MAP scaffold  

- [x] LIV-CAPABILITY-MATRIX  

- [x] Screen cards — **6 P0 YAML** (not 100+)  

- [~] Figma — external design sprint (parallel, not blocking beta)  

- [~] `.local/discovery-notes` — founder interviews (G2 evidence)  

- [x] G2/G3 launch ops — tracked in [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md) + [`LIVIA-PRODUCTION-READY.md`](./LIVIA-PRODUCTION-READY.md) §6  



---



## 6. Sign-off



| Role | Sign | Date |

|------|------|------|

| Founder | ☑ Spec + readiness accepted | 2026-05-21 |

| Eng | ☑ Phases 0–6 core shipped in repo | 2026-05-21 |



**In-repo documentation and product spec are complete for closed beta.** Execute G2/G3 only via [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md) (off-platform). Product narrative: [`LIVIA-PRODUCTION-READY.md`](./LIVIA-PRODUCTION-READY.md).



---



*“All docs ready” for EU beta = L2 spec + L4 contracts + L7 critical ops — not every deferred item.*

