# Guest hub — My Livia (`/my`) program

**Status:** draft (2026-06)  
**Surface:** W6 — `guest.public.hub` · route `/my`  
**Registry:** `lib/policy/src/platform-surface-registry.ts`

---

## What it is

End clients’ **cross-business portal** on Livia: phone OTP sign-in, upcoming visits, favourite shops, rebook links to each studio’s `/b/{slug}`. Separate from tenant W4, but should feel like the same product family as noir-dusk `/b` and owner dashboard.

**Code today:** `artifacts/livia-dashboard/src/pages/my-livia.tsx` · `guest-hub.service.ts` · `GuestHubShell`

---

## Gap vs rest of Livia (founder UAT notes)

| Area | Today | Target |
|------|--------|--------|
| **Visual** | Generic `public-booking-shell` | Presentation-aware where shop has beauty preset; Livia wordmark + calm guest typography |
| **Shops list** | Flat cards | Vertical-aware logos, last service, “Book again” CTA per shop |
| **Upcoming** | Single hero + list | Match `/b` visit link patterns; running-late / reschedule deep links |
| **Liv** | Static strip + optional chat | Policy-backed guest copy; hand off to shop `/b` for booking changes |
| **Trust** | Minimal footer | Same trust strip patterns as public book (cancel window, secure booking) |
| **Mobile** | Web responsive | PWA add-to-home (guest) parity with `/b` |

---

## Recommended phases

### P0 — Parity polish (1–2 sessions)

- Guest shell tokens aligned with platform marketing + `/b` (spacing, card radius, primary)
- Shop cards: logo, vertical label, favourite heart, explicit **Book again**
- Empty state copy from `@workspace/policy` (not hardcoded salon)

### P1 — Presentation inheritance

- When rebook opens `/b/{slug}`, guest already gets shop skin
- Optional: `/my` header accent from **last visited** or **favourite** shop’s saved preset (read-only)

### P2 — Features

- Waitlist / offer tokens surfaced in hub when API returns them
- Push opt-in for visit reminders (guest notification policy)
- Chain businesses: one hub row per brand vs per location (policy)

### P3 — E2E + screen card

- Screen card `guest.public.hub` in northstar registry
- Playwright: OTP staging path · favourites · upcoming hero link

---

## Cascade (do not bypass)

```text
lib/policy (guest copy, surface registry)
  → api-server guest-hub routes + DTOs
  → livia-dashboard /my + guest components
  → E2E guest-hub spec
```

---

## Related docs

- [`docs/product/LIVIA-PLATFORM-LIFECYCLE.md`](../product/LIVIA-PLATFORM-LIFECYCLE.md) — guest visit links
- [`docs/design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](./VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) — W1–W6 boundaries
- [`docs/design/EXPERIENCE-ARCHITECTURE.md`](./EXPERIENCE-ARCHITECTURE.md) — presentation layers
