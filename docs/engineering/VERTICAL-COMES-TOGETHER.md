# How a vertical comes together on Livia

**Status:** canonical reference (2026-06-03)  
**Reference vertical:** wellness (first full pass)  
**Reads with:** [`VERTICAL-ANNOUNCEMENT.md`](./VERTICAL-ANNOUNCEMENT.md) · [`VERTICAL-ADD-PLAYBOOK.md`](./VERTICAL-ADD-PLAYBOOK.md) · [`COMPOSABLE-EVOLUTION.md`](./COMPOSABLE-EVOLUTION.md)

This doc answers: *“We finished wellness — what is the reusable Livia structure for every other vertical?”*

---

## 1. The loop (one sentence)

**Announce at the policy hub → platform welcomes defaults → tenant-experience flows down → surfaces render capabilities, never invent rules.**

---

## 2. Platform defaults (what every vertical must ship)

These are `PLATFORM_DEFAULT_VERTICAL_ATTRIBUTES` in `lib/policy/src/vertical-announcement.ts`:

| # | Attribute | Module(s) | What “done” means |
|---|-----------|-----------|-------------------|
| 1 | Pack registered | `verticals.ts` | `defineVerticalPack()` + services/staff templates |
| 2 | Vocabulary | `vocabulary.ts` | client/service/team nouns, owner home lines |
| 3 | Playbook | `vertical-playbooks.ts` | wedge, hero steps, `publicCta` |
| 4 | Onboarding extras | `vertical-onboarding.ts` | vertical-specific acts |
| 5 | Presentation handshake | `presentation-presets.ts` + `presentation-surface.ts` | platform-default + 3 natives, distinct morphs |
| 6 | Continuity | `continuity-templates.ts` | SMS/email/public next steps — not hair clone |
| 7 | Guest surfaces | `guest-surfaces.ts` | storefront + visit (+ vertical extras) |
| 8 | Booking experience | `booking-experience-copy.ts`, `verticalOperationalCopy` | pending labels, session detail copy |
| 8b | Copy program CI | `vertical-copy-program.ts` | bleed guards; `pnpm vertical:check` |
| 9 | Guest public W5 | `guest-public-experience.ts` | `/b` hero, grid/list, care notes, visit prep |
| 10 | Coverage registry | `vertical-coverage.ts` | demo slug, tier, doc id |

**CI:** `pnpm vertical:check` — all verticals must pass `validateVerticalAnnouncement()`.

---

## 3. Per-vertical announcement (extensions)

Wellness is the template. In `vertical-announcement.ts` each vertical adds:

- **Capabilities** with maturity (`R1`, `R1.1`, `R2`)
- **operatorShell** (e.g. `wellness-full-nav`)
- **roomBoard** / other honest limitations
- **routes** (e.g. `/day-packages`, booking resources)
- **extensions** bag for nav items, inspiration doc path, etc.

Surfaces read `GET /api/me/tenant-experience` → `announcement`:

- `readyCapabilities` → must render
- `deferredCapabilities` → label or preview only (no fake prod)
- `roomBoard.footnote` → show on Today

---

## 4. Build order (copy this for vertical #4…#9)

```text
1. Policy hub (Ring 1)
   vocabulary · playbooks · presets · continuity · guards · guest-public-experience
   · booking-experience-copy · announcement package

2. Registry + demo seed
   VERTICAL_COVERAGE_REGISTRY row · demo slug · POST demo sync

3. API (Ring 2)
   tenant-experience includes announcement · public /b uses vertical on business row

4. W4 dashboard
   presentation CSS · layout morph · operator shell · operational list shells
   · booking detail · inbox · settings (resources if room-based)

5. W5 public
   /b storefront · guards · confirm copy · visit token prep
   · preset-specific hero + catalog layout

6. Mobile (minimum)
   tenant vocabulary on tabs · pending copy · presentation tint

7. Docs
   *-VERTICAL-PROGRAM.md L0–L8 · playbook · inspiration doc (optional)
   · FOUNDER-SMOKE.md · targets locked

8. Sign-off
   founder smoke · vertical:check · typecheck
```

---

## 5. What wellness proved (checklist for next vertical)

| Layer | Wellness artifact |
|-------|-------------------|
| Inspiration | `docs/product/WELLNESS-VERTICAL-INSPIRATION.md` |
| Program | `docs/product/WELLNESS-VERTICAL-PROGRAM.md` |
| Announcement | `vertical-announcement.ts` WELLNESS_EXTENSIONS |
| Guest /b | `guest-public-experience.ts` + `wellness-public-shell` CSS |
| Operator | `wellness-operator-shell.ts`, `wellness-presentation.css`, morph Today, **interactive room board** |
| Economics | `package_credit_ledger` · evening-ledger Today · `/day-packages` credits |
| North star | `docs/product/WELLNESS-NORTHSTAR-PROGRAM.md` |
| Master backlog | `docs/product/WELLNESS-MASTER-BACKLOG.md` |
| Booking | `booking-experience-copy.ts` |
| Smoke | `docs/operations/WELLNESS-FOUNDER-SMOKE.md` |

**Do not copy wellness UI onto fitness/medspa** — copy the **pipeline**: announce → welcome → thin surfaces.

---

## 6. How Livia “ingests” (for agents and humans)

| Step | Action |
|------|--------|
| **Register** | Add enum + `VERTICAL_PACKS` + all `Record<BusinessVertical, …>` |
| **Announce** | Extend `buildVerticalAnnouncementPackage()` capabilities + extensions |
| **Welcome** | Fix until `validateVerticalAnnouncement(vertical).ok` |
| **Expose** | `resolveTenantExperience()` already merges `announcement` |
| **Render** | Dashboard/mobile/public read `tenantExperience` + `guestPublicExperience()` — no new vertical `if` chains unless a **layout primitive** is truly unique |
| **Defer** | Mark R2 in announcement; surfaces show note/preview only |
| **Promote** | When two verticals share a new key, add to platform defaults |

---

## 7. Remaining verticals

Use wellness as the **process** reference; use each vertical’s program doc as the **content** reference. Fine-tune per category (clinical, chair, vehicle, pet) in vocabulary and `guest-public-experience`, not in dashboard forks.

| Vertical | Status (2026-06-03) |
|----------|---------------------|
| Wellness | Reference vertical — full pass |
| Beauty | P0 shipped (nav, menu onboarding, announcement) — see `BEAUTY-FOUNDER-SMOKE.md` |
| Hair | Next heartland — apply same P0 pattern |

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-06-03 | Beauty P0 row added after wellness-parity implementation |
| 2026-06-03 | Canonical “comes together” doc from wellness build session |
