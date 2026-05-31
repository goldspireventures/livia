# R2 build status — post-R1 program (living doc)

**Authority:** [`product/LIVIA-FINAL-BUILD-PLAN.md`](../product/LIVIA-FINAL-BUILD-PLAN.md) §5  
**Sequencing:** [`product/LIVIA-WIDE-BUILD-PLAN.md`](../product/LIVIA-WIDE-BUILD-PLAN.md) §6  
**Tracker:** [`PLATFORM-BACKLOG.md`](./PLATFORM-BACKLOG.md)  
**Updated:** 2026-05-31 (Wave 16 — guest-token CI + waitlist accept)

---

## Theme

Guest surfaces complete · P7 hub · support at scale · mobile parity push.

**Honest progress:** ~40% code landed; ~25% exit criteria (Wave 15).

---

## Exit criteria (R2)

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| R2-E1 | W6 guest hub OTP + favorites + book-again | **Partial → Wave 15** | upcoming + favorites + service prefill |
| R2-E2 | W5 consent · pay · waitlist · visit all verticals | **Partial** | `/pay/:token` shell added wave 15 |
| R2-E3 | I4 Context pane + runbook links in Thread | **Partial → Wave 15** | registry runbook in context column |
| R2-E4 | B1 registry complete + Investigate depth | **Partial** | P0 catalog + trace lookup |
| R2-E5 | Mobile Today v2 + guest deep links | **Partial → Wave 15** | `/my-livia`, `/guest-surface`, 12s Today refetch |
| R2-E6 | Proactive Radar feeds (stuck onboarding, zero bookings) | **Partial → Wave 15** | `/internal/ops/radar/feeds` |
| R2-E7 | CI guest-token suite | **Partial → Wave 16** | `guest-token-api` in CI api gate; UI `guest-token-suite` |
| R2-E8 | Support opens tenant from thread (impersonation policy) | **Partial** | bundle API exists |

---

## Wave log

| Wave | Date | Shipped |
|------|------|---------|
| 16 | 2026-05-31 | Guest waitlist accept polish · demo waitlist token API · `guest-token-api` CI · `guest-token-suite` UI |
| 15 | 2026-05-30 | **R1 closed** · guest hub upcoming/favorites/book-again · `/pay/:token` · owner booking toast · Radar proactive feeds · support context registry · mobile My Livia + guest deep links · Today/bookings 12s refetch |
| 14 | 2026-05-30 | G2 intake/waitlist · B1 registry · F6 Board/Radar |

---

## Next agent queue

1. Hub Liv orchestrator chat (R2.5)
2. Waitlist accept in CI with live API + dashboard (full `guest-token-suite` in release gate)
3. Split Aurora demo composite (R2-F)
4. Support opens tenant from thread — impersonation policy (R2-E8)
5. Mobile guest deep links parity audit

---

## Founder UAT (when R2 exit ready)

Staging stack + `/my` full flow (favorites, upcoming, book-again), `/pay/:token`, mobile My Livia, Radar proactive section.
