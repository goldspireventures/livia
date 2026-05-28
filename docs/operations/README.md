# Livia Inc — operations (L7)



**Status:** v1.1 (2026-05-21)



## Index



| Doc | Audience |

|-----|----------|

| [`support-runbook.md`](./support-runbook.md) | Support L1/L2 |

| [`feature-triage-sop.md`](./feature-triage-sop.md) | Product weekly triage |

| [`logging-and-correlation.md`](./logging-and-correlation.md) | Eng on-call |

| [`disaster-recovery.md`](./disaster-recovery.md) | Eng + founder |

| [`internal-onboarding.md`](./internal-onboarding.md) | New hires |

| [`staging-environment.md`](./staging-environment.md) | Deploy smoke |

| [`../product/LIVIA-RESILIENCE-OPS-AND-TRUST.md`](../product/LIVIA-RESILIENCE-OPS-AND-TRUST.md) | Master resilience |

| [`../engineering/incident-response.md`](../engineering/incident-response.md) | Incidents |

| [`../audits/marketing-vs-reality.md`](../audits/marketing-vs-reality.md) | Claim audit |



## Cron endpoints (authenticated)



| Route | Purpose |

|-------|---------|

| `POST /internal/cron/send-reminders` | T-24h fallback |

| `POST /internal/cron/onboarding-stuck?send=true` | List + email stuck owners |

| `POST /internal/cron/test-push` | Push pipeline smoke |



Header: `X-Internal-Cron-Secret`



## Planned



- `dsr-runbook.md` — GDPR operator steps (G3)



Tenant flows: [`../product/LIVIA-COMPLETE-SYSTEM-SPEC.md`](../product/LIVIA-COMPLETE-SYSTEM-SPEC.md) §9.

