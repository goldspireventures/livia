# v3 surface matrix

**Program:** [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md)  
**Closure:** [`V3-ENGINEERING-CLOSED.md`](./V3-ENGINEERING-CLOSED.md)  
**Release rule:** [`../engineering/release-pipeline.md`](../engineering/release-pipeline.md)

Legend: ✅ Done · 🟡 Partial · ❌ Not started · ⏸ Gate (counsel / SOC2 / founder)

**Last updated:** 2026-05-22 (v3 engineering closure pass)

---

## Block M — Experience

| Item | Status |
|------|--------|
| Motion tokens (web + mobile + doc) | ✅ |
| Public confirm Next steps panel | ✅ |
| Inbox unified thread UI (badges) | ✅ |
| Booking continuity timeline | ✅ |
| Mobile haptics / motion parity | 🟡 |
| livia.io ↔ `/b` UX parity | 🟡 |
| Pack-driven hair vs medspa tone | ✅ |

---

## Block N — Booking continuity

| Item | Status |
|------|--------|
| `booking-continuity-bridge` workflow | ✅ |
| Continuity templates (DE formal) | ✅ |
| SMS outbound on book | ✅ |
| MMS → booking media | ✅ |
| Booking guards on public book | ✅ |
| Duration guard (hair) | ✅ |
| IG deep-link hint on confirm | ✅ |
| `awaiting_continuity` pending reason | ✅ |
| Stuck bookings queue | ✅ |
| Booking detail timeline + media | ✅ |
| Meta IG API | ⏸ ADR deep-link path |
| E2E web → thread → confirm | 🟡 spec exists |

---

## Track 1 — Platform

| Item | Status |
|------|--------|
| Payroll export + preflight | ✅ |
| Internal portal (health, traces, Liv) | ✅ |
| Liv OS registry | 🟡 |
| Live OAuth / voice honesty | 🟡 |
| Mobile parity | 🟡 |
| Workflow depth | ✅ |
| Public API alpha | ✅ |

---

## Track 2 — Expansion

| Item | Status |
|------|--------|
| `de-DE` locale pack (policy + `/de`) | ✅ |
| German voice + eval | ⏸ |
| `fr-FR` text pack | ✅ |
| Medspa consent workflow | ✅ ⏸ counsel for campaigns |
| Allied health pack | ✅ |
| livia.io DE + verticals | ✅ |
| Pet / detailing packs | ✅ |

---

## Track 3 — Enterprise

| Item | Status |
|------|--------|
| C9 / chain hooks | ✅ entitlements |
| Audit export pack | ✅ CSV |
| SSO stub | ✅ schema + API |
| BYOK | ⏸ ADR |

---

## Block R — Release rule

| Item | Status |
|------|--------|
| PR template | ✅ |
| `scripts/v3-release-check.sh` | ✅ |
| CI enforce sweep | 🟡 typecheck in script |

---

## Scenario coverage (P0)

| Scenario | Status |
|----------|--------|
| 01 Post-web IG/SMS handoff | ✅ |
| 02 New client intake | ✅ |
| 05 No-show / policy | 🟡 SMS recovery |
| 06 Duration guard | ✅ |
| 14 DE regulatory | ✅ overlay |
| 20 Support one story | 🟡 internal traces |
