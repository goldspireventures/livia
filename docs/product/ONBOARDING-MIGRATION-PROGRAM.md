# Onboarding & migration program

Authority for **Wave A** founder onboarding and **import/migration ingest** — how we decompose, build, and verify end-to-end before touching UI patches.

Related: [`IMPORT-MIGRATION-SPEC.md`](IMPORT-MIGRATION-SPEC.md) · [`LIVIA-MIGRATION-INGEST-TEMPLATE.md`](LIVIA-MIGRATION-INGEST-TEMPLATE.md) · [`onboarding-program.ts`](../../lib/policy/src/onboarding-program.ts) · [`migration-fast-track-program.ts`](../../lib/policy/src/migration-fast-track-program.ts)

---

## 1. Business goal

**Sacred metric:** first booking on Livia.

Onboarding exists to get a real shop from **legal acceptance → bookable → first guest booking** with minimum owner friction. Migration is not a data archaeology project — it is a **fast path to bookable** so Liv can finish setup in-app.

| Path | Owner promise | Success |
|------|---------------|---------|
| **Fresh** | "Start clean" | Shop + profile + hours + open |
| **Import** | "Bring my shop" | Minimal shell → import → hours → open (profile from import) |

---

## 2. Product checkpoints (must cross)

```text
G0 Legal accepted (platform terms)
G1 Path chosen (fresh | import) — irreversible for session unless support
G2 Business exists (portal shell for import; full create for fresh)
G3 Data sufficient to book (menu OR honest empty + Liv nudge)
G4 Hours set (or inherited from import)
G5 Public link live (onboarding act a12 / open)
G6 First booking (activation — outside onboarding UI)
```

**Import-specific:**

- `migrationImported` checklist flag when any entity lands
- Switching fast track: after import → **hours** (skip profile act a2)
- Honest automation: never show Connect when tier ≠ `oauth_live` | `partner_live`

---

## 3. Flow decomposition

### 3.1 Fresh (4 acts)

`a1_shop` → `a2_profile` → `a5_hours` → `a12_open`

Policy: default `resolvePortalNavActs` / standard onboarding program.

### 3.2 Import (4 acts)

`a1_shop` (shell) → `a11_migration` → `a5_hours` → `a12_open`

Policy: `migration-fast-track-program.ts` — `afterPortalBusinessCreatedState`, `afterMigrationImportOnboardingState`.

### 3.3 Migration ingest (platform spine)

```text
lib/policy
  incumbent-migration-atlas
  migration-ingest-program (featured + search + profiles)
  migration-automation-truth (oauth_live | partner_live | file_only | …)
  migration-oauth-program | migration-partner-program
  migration-ingest-template (LiviaMigrationEntityBundle v1.0)
  migration-ingest-job-program (async threshold + event name)
  booking-url-mirror-program (honest public-page limits)
        ↓
API
  migration-ingest.service (profile, connection, unified ingest)
  migration-oauth-import | migration-partner-import
  apply-migration-bundle.service
  booking-url-mirror.service
  migration-import-job.service + Inngest workflow
        ↓
Surfaces
  dashboard migration-switch-panel (+ file import panel)
  mobile MigrationSwitchPanel
        ↓
Onboarding state
  import-onboarding.service → afterMigrationImportOnboardingState (switching)
```

### 3.4 Ingest modes (`POST …/migration/ingest`)

| Mode | When | Backend |
|------|------|---------|
| `oauth_pull` | Acuity, Square, Fresha, GCal — env + connected | `migration-oauth-import` |
| `partner_pull` | Phorest, Zenoti — partner env + salon ID | `phorest` / `zenoti` services |
| `file_bundle` | CSV / exports | `runMagicStudioImport` |
| `booking_url_mirror` | Public book page — menu hints only | `booking-url-mirror` → bundle apply |

Large bundles (≥400 rows or big CSV) → `migration_import_jobs` + Inngest `migration/import.requested`.

---

## 4. Data model

### 4.1 Onboarding checklist (migration fields)

- `migrationIntent`: `fresh` | `switching`
- `migrationSource`: incumbent id from atlas
- `migrationBookingUrl`: optional mirror source
- `migrationExternalId`: salon / center / branch id for partner pull
- `migrationImported`: boolean after first successful ingest

### 4.2 `migration_import_jobs`

Table `059-migration-import-jobs.sql` — status, mode, sourceId, results JSON, payload for replay.

### 4.3 Entity bundle

`LiviaMigrationEntityBundle` — single apply path for OAuth, partner, mirror, and partner handoffs. Order: services → staff → clients → appointments.

---

## 5. Automation truth (factual)

| Platform | Tier when live | Owner action |
|----------|----------------|--------------|
| Acuity, Square, Fresha, GCal | `oauth_live` | Connect & import |
| Phorest, Zenoti | `partner_live` (env set) | Salon ID + partner import |
| Phorest, Zenoti | `partner_not_built` | Save ID + CSV |
| Booksy, most | `file_only` | Upload exports |
| Booking URL | mirror | Menu names only; no clients |

Env gates: `ACUITY_*`, `SQUARE_*`, `FRESHA_*`, `GOOGLE_OAUTH_*`, `PHOREST_PARTNER_*`, `ZENOTI_PARTNER_API_KEY`.

---

## 6. Wave alignment (A–F)

| Wave | Status | Delivered |
|------|--------|-----------|
| **A — Founder onboarding** | Shipped | Path picker, portal default, 5-step fast track (incl. book link), import shell from catalog |
| **B — Platform kernel** | Shipped | Policy hub, ingest template, jobs + Inngest, OpenAPI + codegen |
| **C — Guest face** | Shipped | `a8_public_link` in nav; completion → `/book/:slug`; `testBooking` from real public book |
| **D — Experience** | Shipped | Vertical on a11/a12; Settings uses `MigrationSwitchPanel`; mobile profile API |
| **E — Lifecycle** | Shipped | Resume restores `migrationIntent`; analytics events; job polling (web) |
| **F — Trust** | Shipped | `migration-automation-truth` on dashboard + mobile + Settings; no manual testBooking tick |

---

## 7. Verification

**Unit:** `migration-automation-truth`, `migration-fast-track`, `booking-url-mirror-program`

**API:** partner pull with mock env; ingest job sync path; bundle apply idempotency (ensure* helpers)

**E2E:** `migration-import-path.spec.ts` — import track panel, Booksy shows no connect, honest limit banner

**Manual founder:** `/onboarding?fresh=1&path=1` → Import → pick source → file upload or connect (if env)

**Gates before ship:** `pnpm run typecheck` · migration SQL applied · Inngest workflow registered

---

## 8. Out of scope (honest)

- Full historic appointment depth for every incumbent
- Scraping client PII from public booking pages
- Perfect Phorest/Zenoti field mapping without partner sandbox validation

**Implemented (was out of scope in v1 draft):** legacy Settings broker grid replaced by `MigrationSwitchPanel`; async jobs + booking URL mirror; legacy 12-act wizard retired for fresh founders (portal default).

---

## 9. Build order (inside-out)

1. Policy truth + nav + template  
2. DB jobs + bundle apply  
3. Partner + mirror services  
4. Unified ingest + Inngest  
5. Wire dashboard/mobile + job polling  
6. E2E + founder manual script  

Do not ship UI-only changes without traversing this spine.
