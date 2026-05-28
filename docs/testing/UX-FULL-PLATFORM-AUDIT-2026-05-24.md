# Full platform UX audit — 2026-05-24

**Method:** `pnpm e2e:full-visual-audit` — Playwright (web) + Maestro (mobile) + code review.  
**Captures:** `e2e/visual-captures/full-audit/` (web routes), `web/<persona>/` (persona matrix), `mobile/` (native) — **delete after sign-off** (not committed).  
**Runbook:** [`FULL-VISUAL-AUDIT-WEB-MOBILE.md`](./FULL-VISUAL-AUDIT-WEB-MOBILE.md)  
**Master plan:** [`../product/LIVIA-OS-MASTER-PLAN.md`](../product/LIVIA-OS-MASTER-PLAN.md)

---

## Executive summary

The platform **works** but often feels like **one salon product with labels swapped**. Highest-impact gaps: **wrong IA** (Toolkit Operations grid, Hiring in nav), **buried high-frequency actions** (running late), **actor-wrong flows** (manager files leave for staff), **weak vertical distinction** (same dark aurora everywhere), and **public booking** that is clear but **not yet vertical-branded**.

---

## Public surfaces

| Surface | Clarity | Flow | Beauty | Issues |
|---------|---------|------|--------|--------|
| `/demo` | Good | Launcher → business | Dark marketing OK | Too many persona cards vs “one owner per business” |
| `/sign-in` | Good | Clerk + demo password | Strong | — |
| `/b/:slug` (luxe) | **Good** | SERVICE→TIME→DETAILS→DONE | Premium serif | **Same theme for all verticals**; Liv intro generic; no feedback/aftercare entry |
| `/b/clarity-medspa` | OK | Same wizard | Same as salon | No clinical consent step visible |
| `/b/harbour-wellness` | OK | Same | Same | “Day spa” mental model not in UI chrome |
| `/guides` | Dev-only feel | — | — | Not customer-facing |

**Public user confusion risks:** deposit/legal line small; no “what happens next” after book; no “I’m running late” for customer.

---

## Authenticated — hair (luxe-salon-spa) — representative of “default” UX

| Route | Logical? | Out of place | Notes |
|-------|----------|--------------|-------|
| **Today** | Yes | “Demo” name; **shop** copy on allied should be Practice | Liv briefing strong; **no running late chip** |
| **Inbox** | Yes | — | Good queue metaphor |
| **Bookings** | Yes | — | Per-row actions need **running late** |
| **Toolkit** | **No** | **Operations grid duplicates sidebar**; Hiring still in sidebar | Running late buried in card; payroll OK for founder only |
| **Hiring** | **No** | **Job board — not our product** | Remove entirely |
| **Lifecycle** | Weak | Empty periods | Hide nav when no suggestions |
| **Rota** | Mixed | Leave + shifts + manager filing for others | Split; staff self-serve only |
| **Settings** | Yes | Tab “Shop” on physio | Use `locationNoun` |
| **Day packages** | N/A hair | — | — |
| **Experience / Portal** | Demo | — | Hide in prod |

**Sidebar clutter (owner):** Today, Inbox, Bookings, Customers, Team, Rota, **Hiring**, Lifecycle, Audit, Settings, Toolkit, Portal — **too many**; Hiring and Toolkit lowest value.

---

## Vertical screenshot gaps (audit run)

Wrong demo slugs caused skips — correct slugs from seed:

| Vertical | Slug |
|----------|------|
| allied-health | `motion-physio-cork` |
| body-art | `ink-anchor-galway` |
| pet-grooming | `paws-parlour-dublin` |
| fitness | `peak-fitness-dublin` |
| beauty | `bloom-beauty-dublin` |

**Delta 2026-05-25:** Phase A complete; Phase B — vertical home modules, public booking hero + label, booking context rail, list-row running late, Liv tool hints per vertical, inbox seeds for body-art/pet/fitness, settings tab uses `locationNoun`.

---

## Persona gaps (from contextual captures + code)

| Persona | Missing | Wrong |
|---------|---------|-------|
| Staff | Running late on next apt | My chair still salon “chair” on physio |
| Manager | Leave approval inbox | — |
| Receptionist | Running late on floor | — |
| Owner | CFO export not on Today | Toolkit as second home |
| Founder | OK chain | Toolkit ops grid redundant |

---

## Feature opportunities (not built — attract users)

1. **Post-visit feedback** — Liv SMS/email → owner dashboard  
2. **Aftercare** — tattoo / medspa / physio exercise link  
3. **Receipts** — branded confirmation page  
4. **Customer running late** — public thread  
5. **Design proof loop** — customer upload → artist approve (tattoo)  
6. **CFO pack** — revenue, utilisation, no-show cost, SMS spend CSV  
7. **Dynamic home** — hide empty modules; surface only actionable  
8. **Report issue** — ✅ renamed; needs ticket automation internal  

---

## Priority fixes (Phase A)

- [x] Documented here  
- [x] Remove Hiring (UI + API)  
- [x] Toolkit: remove Operations grid; Liv command only  
- [x] Running late: global sheet + per-booking API  
- [x] Rota: approvals only for managers; request on staff self  
- [x] `applyVerticalTheme` (all 9 verticals)  
- [x] Conditional Lifecycle nav  
- [x] Screenshots deleted; re-run with `pnpm e2e:full-visual-audit` when validating Phase B

---

## Sign-off

Founder review: confirm Phase A matches top 5 rows in **Priority fixes**, then delete screenshot folder.
