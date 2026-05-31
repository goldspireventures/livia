# Web ↔ mobile parity matrix

**Updated:** 2026-05-31  
**Captures:** `pnpm e2e:full-visual-audit` (web + mobile) · `e2e/visual-captures/web/<persona>/` · `e2e/visual-captures/mobile/`

**Status summary:** Core ops surfaces **OK** (2026-05-25). Remaining gaps: settings depth (billing/team web-first), presentation preset morph on mobile, premium motion on Today entry.

This doc tracks **tenant product** surfaces (not marketing site, not internal ops portal).

**Mobile UX rules:** [`design/MOBILE-UX-PRINCIPLES.md`](../design/MOBILE-UX-PRINCIPLES.md)  
**Surface / breakpoint morph:** [`design/SURFACE-AND-BREAKPOINTS.md`](../design/SURFACE-AND-BREAKPOINTS.md)

---

## Surface model (phone · tablet · desktop)

| Class | Web | Native mobile |
|-------|-----|---------------|
| Phone | `<640px` | default |
| Tablet | `640–1023px` | shortest side `≥600dp` |
| Desktop | `≥1024px` | web handoff |

Same feature, different **shape** — not a zoomed-out desktop. Module morph tables: [`SURFACE-AND-BREAKPOINTS.md` Part III](../design/SURFACE-AND-BREAKPOINTS.md#part-iii--layout-morph-by-vertical-module).

---

## Navigation model

| Persona | Web home | Mobile home (tab) |
|---------|----------|-------------------|
| Founder | `/chain` (Glance) | Today + **Glance** tab (chain rollup) |
| Owner | `/dashboard` Today | `/(tabs)/` Today |
| Manager | `/inbox` Queue | Approvals tab (queue) |
| Staff | `/my-day` My chair | My day tab |
| Receptionist | `/bookings` Floor | Bookings tab |

Web uses sidebar ritual nav; mobile uses bottom tabs + **More** for staff/services/settings/audit/premises/packages.

---

## Surface parity

| Surface | Web | Mobile | Status |
|---------|-----|--------|--------|
| Glance / multi-shop | `/chain` pulse rollup | Glance tab + `GET /me/chain-rollup` | **OK** (2026-05-24) |
| Today / dashboard | `/dashboard` | `/(tabs)/index` + briefing + Liv moments + stuck | **OK** (2026-05-25) |
| Liv memory (customer) | Customer detail panel | Client detail Liv memory card | **OK** (2026-05-25) |
| Liv tool catalog (per shop) | Settings → Liv → Tool catalog | Settings → capabilities summary + web handoff | **OK** (2026-05-25) |
| Inbox + Liv assist chips | `/inbox` OPEN+HANDED_OFF | `/(tabs)/inbox` Ask Liv chips | **OK** (2026-05-25) |
| Booking continuity timeline | Booking detail panel | `/booking/[id]` timeline card | **OK** (2026-05-25) |
| Bookings list + filters | `/bookings` | `/(tabs)/bookings` | **OK** |
| New booking | Dialog `?create=1` | Full screen `/booking/new` | **OK** |
| Booking detail | `/bookings/:id` | `/booking/[id]` | **OK** |
| Pending reason on list | Label under status | `BookingCard` subtitle | **OK** |
| Customers | `/customers` | `/(tabs)/customers` | **OK** |
| Customer detail | `/customers/:id` | `/customer/[id]` | **OK** |
| Care series (allied-health) | Customer web | Client detail card (read-only) | **OK** (2026-05-24) |
| Channel merge | Customer web | Client detail merge block | **OK** |
| Staff roster | `/staff` | More → Staff | **OK** |
| Services | `/services` | More → Services | **OK** |
| Approvals / pending queue | Manager inbox + bookings | `/(tabs)/approvals` | **OK** |
| My day (staff) | `/my-day` | `/(tabs)/my-day` | **OK** |
| Manager chair preview | Link to `/my-day` | More → My chair preview | **OK** (2026-05-24) |
| Premises (shared building) | `/premises` | More → Shared premises (read + web CTA) | **OK** (2026-05-24) |
| Day packages | `/day-packages` | More → Day packages (wellness/medspa) | **OK** (2026-05-24) |
| Settings — shop | Tab `shop` | Settings scroll | **Partial** — no logo URL on mobile |
| Settings — Liv toggle | Tab `liv` | Settings Liv switch | **OK** |
| Settings — comms | Tab `comms` | Read-only comms block | **Partial** |
| Settings — policy | Tab `policy` | Read-only + edit on web | **Partial** |
| Settings — team / billing / ownership | Tabs | Billing readout + web CTA | **Gap** — web-first |
| Audit log | `/audit` | `/audit` | **OK** |
| Lifecycle | `/lifecycle` (hidden until qualified) | `/lifecycle` | **OK** |
| Running late | Today + booking detail sheet | Today quick actions + booking (CONFIRMED) | **OK** (2026-05-25) |
| Leave request | Staff profile → Leave; manager Rota | More → Request leave (`/time-off`) | **OK** (2026-05-25) |
| Vertical accent (Today) | `vertical-theme.ts` on app shell | Today vertical line uses `verticalAccentHex` | **OK** (2026-05-25) |
| Presentation preset + surface morph | `data-presentation` + `data-surface` (staging) | Preset accent + phone/tablet layout | **Planned** — [`SURFACE-AND-BREAKPOINTS.md`](../design/SURFACE-AND-BREAKPOINTS.md) |
| Public booking theme | `/b/:slug` vertical hero | Same web surface (mobile browser) | **OK** (2026-05-25) |
| Guest visit link (late, feedback, receipt) | `/b/:slug/visit/:token` | Web only (SMS link) | **OK** (2026-05-25) |
| Visit feedback on Today | `VisitFeedbackStrip` | `VisitFeedbackCard` on Today | **OK** (2026-05-25) |
| Cross-shop alerts | Chain page `chain-alerts` | Glance alerts list + Today founder strip | **OK** (2026-05-25) |
| Hiring / job board | **Removed** | **Removed** | **N/A** |
| Liv command (ex-toolkit) | `/toolkit` | — | Web-first |
| Onboarding / second shop | `/onboarding?intent=second-shop` | `/onboarding` | **Partial** |
| Public booking | `/b/:slug` | Browser | **OK** — not native |
| Demo portal | `/demo` Clerk + live DB | `/demo` showcase · live via **sign-in** + Demo guide | **OK** (different UX, same data) |

---

## Persona visibility gaps

| Capability | Web | Mobile |
|------------|-----|--------|
| Services nav item | Owner nav | More only | Acceptable |
| Audit / Lifecycle | Founder/owner nav | More | **OK** |
| Founder chain → open shop | `openShop()` + toast | Glance tap → Today | **OK** (2026-05-24) |
| Premises create / co-tenant | Full editor | Web handoff | Acceptable |

---

## Recommended implementation order (mobile)

1. **P0** — Chain glance rollup on Glance tab ✅ (2026-05-24)  
2. **P1** — Premises + day packages read surfaces ✅  
3. **P1** — Care series on client (allied-health / wellness) ✅  
4. **P2** — Logo URL in mobile settings (media picker)  
5. **P2** — Maestro flows for premises + glance (`pnpm maestro:visual-capture`)

---

## How to re-check

```powershell
pnpm e2e:full-visual-audit
# or separately:
pnpm e2e:full-visual-audit:web
pnpm e2e:full-visual-audit:mobile
```

Demo data: `POST /api/demo/provision` or `pnpm e2e:prep`.
