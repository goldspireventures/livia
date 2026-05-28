# RFC 0012 — Hours-to-payroll export (v2.5)

**Status:** Deferred — implementation gated on design-partner LOI  
**Canonical boundary & ecosystem model:** [`../product/LIVIA-COMPLETE-SYSTEM-SPEC.md`](../product/LIVIA-COMPLETE-SYSTEM-SPEC.md) §7 (Payroll & people)  
**Problem:** Owners ask for BrightPay/Xero hours; Livia must not become a payroll engine.

## Proposal (future)

- Export `staff_shifts` + completed bookings as CSV (IE/GB formats first).
- Pre-flight UI: unapproved time-off, missing shift end, new hire missing payroll id.
- No tax calculation in Livia — file handoff or OAuth push to partner only.
- Entitlement: `payroll_export` on Studio+.
- v3: connector (BrightPay IE + one UK) — staff map, pay period push, read-only filing status.

## v1 boundary

Scheduling + bookings + rota truth in Livia; payroll calc always third party.

**Decision:** Defer code until ≥3 design partners request with signed LOI; **do not** defer documenting the OS story (see Complete Spec §7).
