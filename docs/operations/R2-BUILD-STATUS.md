# R2 build status — post-R1 program (living doc)

**Authority:** [`product/LIVIA-FINAL-BUILD-PLAN.md`](../product/LIVIA-FINAL-BUILD-PLAN.md) §5  
**Tracker:** [`PLATFORM-BACKLOG.md`](./PLATFORM-BACKLOG.md)  
**Updated:** 2026-05-30 (overnight wave 14)

---

## Theme

Guest surfaces complete · P7 hub · support at scale · mobile parity push.

**Honest progress:** ~25% code landed (foundations); ~10% exit criteria.

---

## Exit criteria (R2)

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| R2-E1 | W6 guest hub OTP + favorites + book-again | **In progress** | migration `029` + `guest-hub.service` + `/my` UI |
| R2-E2 | W5 consent · pay · waitlist · visit all verticals | **Partial** | visit + proof + intake + waitlist accept (wave 14) |
| R2-E3 | I4 Context pane + runbook links in Thread | **Not started** | Thread shell done R1 |
| R2-E4 | B1 registry complete + Investigate depth | **Partial** | P0 catalog + trace lookup + surface picker |
| R2-E5 | Mobile Today v2 + guest deep links | **Not started** | R1 mobile pass only |
| R2-E6 | Proactive Radar feeds (stuck onboarding, zero bookings) | **Partial** | Radar metrics from ticket queue only |
| R2-E7 | CI guest-token suite | **Not started** | |
| R2-E8 | Support opens tenant from thread (impersonation policy) | **Partial** | bundle API exists |

---

## Wave log

| Wave | Date | Shipped |
|------|------|---------|
| 14 | 2026-05-30 | G2 `/intake/:token` + `/waitlist/:token` pages + API · migration `030` · waitlist SMS link-first · B1 registry · F6 Board/Radar/Investigate functional |

---

## Next agent queue

1. Guest hub: favorites toggle API + book-again from `/my`
2. Thread Context pane — runbook links from `support-points` registry
3. Radar proactive feeds — stuck onboarding + 14d zero-booking monitors
4. Deposit-pay guest surface `/pay/:token`
5. Mobile deep links to visit/intake/waitlist tokens

---

## Founder UAT (when R2 exit ready)

Same staging stack as R1 — add `/my` OTP flow, intake/waitlist token links from demo medspa/fitness seeds.
