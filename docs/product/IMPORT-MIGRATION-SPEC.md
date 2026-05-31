# Import & migration — product specification

**Status:** canonical (2026-05-31)  
**Audience:** product, engineering, GTM  
**Purpose:** Productized path from Phorest/Booksy/Fresha → Livia — switching cost story with real tooling.

**Gap:** Mentioned in sales-motion; not spec'd until systems audit.

---

## 1. Scope (R1–R2)

| Source | Entities | Method |
|--------|----------|--------|
| **Booksy** | customers, services, staff | CSV import runbook exists → product UI |
| **Phorest** | customers, appointments history | CSV + migration broker (composable unit #6) |
| **Fresha** | customers, services | CSV template |
| **Manual** | any | CSV template SSOT |

**Not R1:** Two-way sync; live OAuth migration.

---

## 2. Owner UX

Route: `/settings` → **Import data** tab (or onboarding step optional)

1. Choose source system
2. Download Livia CSV template
3. Upload file → validation preview
4. Map columns (auto-detect)
5. Import dry-run counts
6. Confirm → background job Inngest
7. Summary email + audit log entry

---

## 3. API (target)

```
POST /api/businesses/:id/imports
GET  /api/businesses/:id/imports/:jobId
```

Events: `import.completed`, `import.failed`

---

## 4. Honesty

- Marketing may claim "we help you switch" only when this UI ships.
- Partial import OK — customers without history still valuable.

---

## 5. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial import/migration spec |
