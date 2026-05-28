# Full visual audit — web + mobile

**Command:** `pnpm e2e:full-visual-audit`  
**Status:** Run before GA / major phase sign-off.  
**Review log:** [`VISUAL-AUDIT-LOG.md`](./VISUAL-AUDIT-LOG.md) — what each screenshot pass found and what was fixed.

Both **tenant web** (dashboard) and **native mobile** (Expo) must pass human review. Marketing and internal ops are separate Playwright projects.

---

## Prerequisites

| Layer | Requirement |
|-------|-------------|
| API | `pnpm dev:api` → `http://127.0.0.1:3001` |
| Web | `pnpm dev:dashboard` → `http://127.0.0.1:5173` |
| Data | `pnpm e2e:prep` or `POST /api/demo/provision` |
| Mobile | Maestro CLI + iOS Simulator or Android emulator |
| Mobile app | `pnpm --filter livia-mobile run ios` (app must be foregrounded) |

---

## What runs

### Web (`e2e:full-visual-audit:web`)

1. **`full-platform-visual-audit`** — public routes, 10 public booking slugs, 8 vertical owner tenants × ~30 tenant routes → `e2e/visual-captures/full-audit/`
2. **`contextual-web`** — 6 Clerk demo personas × nav + settings tabs → `e2e/visual-captures/web/<persona>/`

### Mobile (`e2e:full-visual-audit:mobile`)

Maestro flows → `e2e/visual-captures/mobile/`:

| Flow | Coverage |
|------|----------|
| `capture-owner-tabs` | Owner tabs + More (staff, services, premises, settings, audit, new booking) |
| `capture-founder-more` | Founder Shops/Glance, Today, Approvals, Inbox, rota, lifecycle, audit |
| `capture-founder-verticals` | 7 EU vertical shops — Today accent per vertical |
| `capture-persona-manager` | Queue, floor, clients, messages, time-off, audit |
| `capture-persona-staff` | My chair, appointments, clients, time-off |
| `capture-persona-receptionist` | Floor, clients, messages, settings |

---

## Partial runs

```powershell
pnpm e2e:visual-audit:all          # web + marketing + internal + mobile-web + Maestro (if installed)
pnpm e2e:visual-audit:all:web      # skip native Maestro
pnpm e2e:full-visual-audit:web
pnpm e2e:full-visual-audit:mobile
node scripts/full-visual-audit.mjs --web-only
node scripts/full-visual-audit.mjs --mobile-only
node scripts/full-visual-audit.mjs --allow-skip-mobile   # web only if Maestro missing
```

### Capture locations (2026-05-26)

| Folder | What |
|--------|------|
| `e2e/visual-captures/full-audit/` | 8 vertical owners × ~30 tenant routes + public booking slugs |
| `e2e/visual-captures/web/` | 6 Clerk personas × nav + settings |
| `e2e/visual-captures/marketing/` | livia.io (incl. verticals, eu-ai) |
| `e2e/visual-captures/internal/` | Ops portal tabs (needs `INTERNAL_OPS_SECRET`) |
| `e2e/visual-captures/mobile-web/` | iPhone 14 viewport on dashboard (fallback) |
| `e2e/visual-captures/mobile/` | Maestro native (Java 17+ + simulator) |

---

## Review checklist

- [ ] No broken layout / overflow on 390×844 (mobile) and 1440×900 (web)
- [ ] Vertical accent visible on Today (mobile) and dashboard home (web)
- [ ] Allied-health copy — no salon-only leaks on physio/medspa screens
- [ ] Public booking: jurisdiction footer, no staff email/phone
- [ ] Error toasts show `requestId` when API fails
- [ ] Founder Glance + chain alerts match web `/chain`
- [ ] Parity gaps in [`WEB-MOBILE-PARITY.md`](../product/WEB-MOBILE-PARITY.md) acceptable or filed

**After sign-off:** delete `e2e/visual-captures/**` (gitignored); keep findings in [`UX-FULL-PLATFORM-AUDIT-2026-05-24.md`](./UX-FULL-PLATFORM-AUDIT-2026-05-24.md).
