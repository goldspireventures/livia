# Import & migration — product specification

**Status:** canonical (updated 2026-06-21)  
**Audience:** product, engineering, GTM  
**Authority:** [`INCUMBENT-MIGRATION-ATLAS.md`](./INCUMBENT-MIGRATION-ATLAS.md) for per-platform research and roadmap.

---

## 1. Scope

Productized switching for solo owners and small studios. **Sacred metric:** first booking on Livia — migration is in service of that, not perfect history.

| Layer | Shipped | Planned |
|-------|---------|---------|
| Universal CSV (clients, services, staff, appointments) | Yes | |
| Column auto-detect | Yes | Manual column map UI |
| Magic setup (multi-CSV bundle) | Yes (API + UI) | |
| Fast-track onboarding (fresh vs switching) | Yes | |
| Platform source picker + Liv walkthrough | Yes | |
| OAuth brokers (Fresha, Square, Acuity, …) | Stub | P1–P2 per atlas |
| Background import jobs (Inngest) | No | P2 |
| File upload (.csv) | No | P2 |

---

## 2. Owner UX

### Onboarding (switching)

1. Sign up (Clerk)  
2. Create business → **Bringing my shop**  
3. Shop profile (name, slug, phone)  
4. **Bring your data** — pick Phorest / Fresha / Booksy / … → Liv export steps → paste CSV(s) → **Apply to my shop**  
5. Hours → Liv → public link → go live  

### Settings (anytime)

**Settings → Integrations → Import from your previous tool**

- Single CSV paste with preview  
- Magic setup — four optional paste areas (menu, team, clients, appointments)  
- Migration brokers panel (connect when live; CSV fallback always)

---

## 3. API (implemented)

```
POST /api/businesses/:id/import/preview     # detect kind, headers, row count
POST /api/businesses/:id/import/csv         # single entity import
POST /api/businesses/:id/import/magic-setup # bundled import
POST /api/businesses/:id/import/booksy-csv # legacy clients-only
GET  /api/businesses/:id/competitive-parity
GET  /api/businesses/:id/migration/parallel-run?external=fresha|mindbody
POST /api/businesses/:id/import/oauth/start
GET  /api/businesses/:id/integration-brokers
```

### Target (not built)

```
POST /api/businesses/:id/imports            # async job enqueue
GET  /api/businesses/:id/imports/:jobId     # job status
```

Events: `import.completed`, `import.failed`

**Note:** Import routes are not yet in OpenAPI/codegen — dashboard uses `customFetch`.

---

## 4. Policy hub

| Module | Role |
|--------|------|
| `import-formats.ts` | CSV parse, detect, normalize |
| `incumbent-migration-atlas.ts` | Per-platform export paths + Liv copy |
| `migration-fast-track-program.ts` | Portal nav for switchers |
| `integration-catalog.ts` | Generic integration labels (Settings) |
| `import-onboarding.service.ts` | Act + checklist side-effects |

---

## 5. Honesty

- Marketing may claim **guided switching** today (CSV + Liv walkthrough).  
- Do **not** claim **one-click OAuth migration** until broker status is `oauth_live` in atlas.  
- Partial import is success — top clients + menu + forward calendar beats waiting for perfect history.

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-06-21 | Fast-track onboarding, atlas, magic-setup UI, checklist `migrationIntent` |
| 2026-06-21 | Competitive parity phase 0 CSV stack (see build plan) |
| 2026-05-31 | Initial import/migration spec |
