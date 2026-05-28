# Execution phase progress

**Updated:** 2026-05-26 — **in-repo program complete**  
**Plan:** [`EXECUTIVE-ACTION-PLAN.md`](./EXECUTIVE-ACTION-PLAN.md) · **Founder-only:** [`FOUNDER-BACKLOG.md`](./FOUNDER-BACKLOG.md)

## Verification

```bash
pnpm typecheck
pnpm --filter @workspace/api-server test
pnpm smoke:gate2
# E2E (stack + auth): pnpm test:e2e:preflight
```

---

## Phase 0 — Focus & pipeline ✅ in-repo

| ID | Status | Artifact |
|----|--------|----------|
| A-01–A-07, F-01, SUP-01/03/06 | ✅ | docs/ + support ack service |
| inbox-queue unit test | ✅ | `inbox-queue.test.ts` |
| Founder: F-02–F-05, O-01, O-03, L-01 | ⏸ | [`FOUNDER-BACKLOG.md`](./FOUNDER-BACKLOG.md) |

---

## Phase 1 — Gate 2 build ✅ in-repo

| ID | Status | Notes |
|----|--------|-------|
| E-01–E-03, E-06, E-09, E-10 | ✅ | continuity, queue, digest, Playwright, ack |
| E-04 voice prod | ⏸ | Twilio IE — founder (`X-04`) |
| E-05 Inngest prod | 📄 | [`inngest-prod-runbook.md`](../engineering/inngest-prod-runbook.md) |
| E-07 import | 📄 | [`booksy-import-runbook.md`](../business/booksy-import-runbook.md) |
| E-08 Sentry | ✅ web + mobile hook | mobile: `lib/sentry.ts` (SDK optional) |
| P-04 Liv was wrong | ✅ | `liv-incidents` API + web/mobile cards |
| P-05 wedge UI cuts | ✅ | `@workspace/policy` wedge-gate + route guard |
| P-02 axe smoke | ✅ | `dashboard-gate.spec.ts` + `@axe-core/playwright` |
| C-02 playbook | ✅ | week 0–2 doc |
| M-02 EU AI | ✅ draft | `/eu-ai` |
| X-* prod | ⏸ | founder backlog |

---

## Phase 2 — Declare Gate 2 ✅ in-repo artifacts

| ID | Status | Artifact |
|----|--------|----------|
| A-10 eval report | ✅ | [`EVAL-REPORT-TEMPLATE.md`](../operations/EVAL-REPORT-TEMPLATE.md) |
| A-11 evidence pack | ✅ | [`GATE-2-EVIDENCE-PACK.md`](../operations/GATE-2-EVIDENCE-PACK.md) + `scripts/gate2-evidence-status.mjs` |
| A-12 partner memo | ✅ | [`partner-update-memo-template.md`](../business/partner-update-memo-template.md) |
| A-13 platform kernel | ✅ | [`platform-kernel.md`](../engineering/platform-kernel.md) |
| A-14 failure RFC | ✅ | postmortem template |
| MTR metrics | ✅ | [`wedge-metrics-tracker-template.md`](../business/wedge-metrics-tracker-template.md) |
| Declare / 10 shops / revenue | ⏸ | founder + live partners |

---

## Phase 3 — Gate 3 prep ✅ in-repo drafts

| Area | Status | Artifact |
|------|--------|----------|
| EU AI page | ✅ | marketing `/eu-ai` |
| SOC2 mapping | ✅ | [`soc2-control-mapping.md`](../compliance/soc2-control-mapping.md) |
| Status / changelog | ✅ | marketing `/status`, `/changelog` |
| Deposits / Connect prod | ⏸ | after G2 + founder Stripe |
| Legal / stores / EU pin | ⏸ | founder |

---

## Phase 4 — Scale ✅ in-repo prep

| Area | Status | Artifact |
|------|--------|----------|
| Data room index | ✅ | [`data-room-index.md`](../business/data-room-index.md) |
| Scale motion | ✅ | [`scale-motion-playbook.md`](../business/scale-motion-playbook.md) |
| UK / hire / fundraise | ⏸ | post Gate 2 |

---

## Summary

**All AI-assisted / engineering items from the executive action plan are done in-repo.** Remaining work is **founder-operated** (partners, prod keys, legal, Gate 2/3 declaration) — see [`FOUNDER-BACKLOG.md`](./FOUNDER-BACKLOG.md).
