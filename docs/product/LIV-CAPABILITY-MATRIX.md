# Liv capability matrix

**Status:** L2 (2026-05-21) — maps tools to surfaces  
**Architecture authority:** [`LIV-OPERATING-SYSTEM.md`](./LIV-OPERATING-SYSTEM.md) — full tool catalog, policy domains, internal Liv, event matrix.  
**Code (v1 spine):** `lib/liv-runtime`, `artifacts/api-server/src/services/ai-chat.service.ts`

> This matrix is the **shipped / planned surface map**. The OS spec defines **50+ tools** and policy classes; only two tools are implemented in code today. Do not treat this table as the ceiling.

## Customer-facing channels (v1)

| Capability | Public chat | SMS | Voice (IE) | Owner dashboard |
|------------|-------------|-----|------------|-----------------|
| Answer FAQs | ✅ | ✅ | ⚠️ G2 | — |
| Check availability | ✅ | ✅ | ⚠️ | — |
| Create booking | ✅ if `aiCanBookDirectly` | ✅ | ⚠️ | — |
| Reschedule/cancel | Policy-gated | ✅ | ⚠️ | Human inbox |
| Refund | ❌ customer | ❌ | ❌ | Manager approval |
| Owner-only actions | ❌ | ❌ | ❌ | ❌ |

**Kill switch:** `business.aiEnabled = false` → `AI_DISABLED` on public chat.  
**Disclosure:** `@workspace/ai-disclosure` on all customer-facing channels.

## Actor × mode (target — see OS spec §6)

| Actor | Reactive (inbound) | Proactive (briefing / workflow) |
|-------|-------------------|----------------------------------|
| Customer | Book, FAQ, pay link | Reminders, waitlist, recovery |
| Reception | Draft reply, slot suggest | Inbox SLA, unconfirmed queue |
| Staff | Own day, next client | Running late cascade |
| Manager | PTO, refunds, floor | Staffing gap, strike patterns |
| Owner | Policy explain | Weekly narrative, deposit rate |
| Founder | — | Cross-shop rollup, weak shop |
| Livia Inc | — | Support draft, tenant health, eval triage |

## Implementation truth

| Layer | Status |
|-------|--------|
| Tools in registry | `find_slots`, `create_booking` only |
| Policy resolver | `@workspace/policy` + jurisdiction |
| Per-tenant runtime fleet | ADR 0012 accepted; single process in dev |
| Event → workflow | Inngest (reminder, no-show, etc.) |
| Event → Liv reaction | Mostly **not wired** |
| Internal Liv tools | **Not built** |
