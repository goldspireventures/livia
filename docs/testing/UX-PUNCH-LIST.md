# UX / visual punch list

**Generated:** 2026-05-26  
**Audit run:** `pnpm e2e:visual-audit:all:web` (+ mobile-viewport + contextual retry)

## Capture inventory

| Folder | Screenshots | Coverage |
|--------|-------------|----------|
| `e2e/visual-captures/full-audit/` | ~240+ | 8 verticals × ~30 tenant routes + 10 public `/b/*` + public auth |
| `e2e/visual-captures/web/` | ~80+ | 6 personas (founder, owner, manager, staff×2, receptionist) × routes + settings tabs |
| `e2e/visual-captures/marketing/` | 13 | livia.io home, pricing, verticals, eu-ai, de, europe, contact, status |
| `e2e/visual-captures/internal/` | 10 | Ops portal tabs (Support → Access) |
| `e2e/visual-captures/mobile-web/` | 12 | iPhone-width dashboard (hair + medspa + allied-health + fitness) |
| `e2e/visual-captures/mobile/` | — | **Native Maestro not run in agent shell** (user has Maestro at `%USERPROFILE%\.maestro\bin`; run `pnpm maestro:visual-capture` locally) |

**Total PNGs:** ~368 (gitignored — open locally under `e2e/visual-captures/`)

---

## Automated UX gate findings

See **`VISUAL-AUDIT-LOG.md`** for screenshot-by-screenshot review notes.

| Priority | Route | Issue | Fix status |
|----------|-------|-------|------------|
| P1 | Shell / detail pages | Axe: `button-name` — icon-only buttons | **Partial** — `aria-label` added on back, settings, rota, public booking, chat, integrations, visit feedback; re-run gate to confirm |
| P1 | `/audit` | Axe: `label` — form fields missing labels | **Done** — `audit.tsx` labels + `htmlFor` |
| P1 | Inbox | Misleading “(no messages yet)” on Liv threads | **Done** — `inbox.tsx` preview copy |
| P2 | `/sign-in` | Axe: `link-in-text-block` | **Done** — underlined sign-up link |
| — | E2E | Platform tour blocked inbox clicks | **Done** — tour dismiss in tests |

Re-run: `pnpm --filter @workspace/e2e exec playwright test --project=ux-quality-gate --workers=1`

---

## Public booking (B2C) — Phase B done

- [x] Sticky mobile CTA, cover/address, vertical guard titles, medspa consent UX
- [x] `public-booking-quality` in `pnpm test:e2e:verticals`
- [ ] Human review: `public-b-*` captures after `pnpm test:e2e:verticals:full`

---

## P1 — human review (screenshots)

Review captures for each vertical — look for salon copy on physio/medspa, overflow, empty states.

- [ ] **Hair** (`hair-*`, `luxe-salon-spa`, owner persona) — wedge reference
- [ ] **Allied health** (`allied-health-*`, `motion-physio-cork`) — “Patients” not “Customers”
- [ ] **Medspa** (`medspa-*`, `clarity-medspa-dublin`) — clinical hub only when vertical=medspa
- [ ] **Fitness / pet / body-art / wellness / beauty** — accent + nav appropriate
- [ ] **DE/FR public booking** (`berlin-studio-neun`, `paris-belle-vue`) — locale footer
- [ ] **Founder Glance** (`web/founder/chain.png`) vs mobile `founder-glance` (Maestro pending)
- [ ] **Internal Support** — Liv incident bundle visible on `liv_error` ticket

---

## P2 — layout & growth

- [ ] Inbox master-detail: long thread scroll; reply box pinned
- [ ] Bookings floor: many rows → pagination or virtual list
- [ ] Settings tabs: long forms on mobile-web captures
- [ ] Platform tour: don’t block primary actions on return visits

---

## Native mobile (still required)

```powershell
winget install Microsoft.OpenJDK.17
.\scripts\install-maestro-windows.ps1
pnpm --filter livia-mobile run ios   # simulator foreground
pnpm maestro:visual-capture
```

Flows: owner tabs, founder verticals (7 shops), manager/staff/reception personas.

---

## Re-run full audit

```powershell
pnpm dev:api
pnpm dev:dashboard
pnpm dev:marketing
pnpm dev:internal
pnpm e2e:visual-audit:all          # includes Maestro when installed
pnpm e2e:visual-audit:all:web      # web + marketing + internal + mobile-web only
```
