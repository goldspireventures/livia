# Policy — Data retention

**Status:** v1 (2026-05-07)
**Anchors:** GDPR Art. 5(1)(e) (storage limitation), Art. 17 (right to erasure), `docs/policy/data-residency.md`.

## Posture

Minimum necessary; documented schedule per data class; automated purge; verifiable on audit.

## Retention schedule

| Data class | Active retention | Post-event retention | Hard delete |
|---|---|---|---|
| **Booking records** | While tenant active | 7 years post-cancellation (tax/audit) | After 7 years |
| **Customer profiles** | While tenant active | 30 days after Owner deletes the customer (GDPR Art. 17) | After 30 days |
| **Conversation transcripts (raw)** | 90 days from last message | None — purged | After 90 days |
| **Conversation summaries (Liv-derived)** | While tenant active | Per booking record schedule | Per booking record |
| **Voice recordings (where retained)** | OFF by default; 30 days if Owner-enabled | Same | After 30 days |
| **Audit log** | While tenant active | 7 years post-tenant-departure (immutable; legal hold) | Generally never (subject to specific erasure orders) |
| **AI training data per tenant** | While tenant active | Purged at tenant-departure | Day-of-departure + 7 days |
| **Eval traces (per ADR 0016)** | 90 days; subset to long-term golden set if eval team curates | Curated golden-set retained | Per curation decision |
| **Backups** | 30 days rolling | Same | After 30 days |
| **Sentry error reports** | 90 days | None | After 90 days |
| **Plausible analytics** | 24 months aggregated | None | After 24 months |
| **Stripe billing records** | Per Stripe retention (regulatory minimum 7y) | Same | Per Stripe |
| **Email logs (Resend)** | 30 days; metadata only | None | After 30 days |
| **SMS/voice logs (Twilio)** | 30 days; metadata + per-call billing record | Same | Per Twilio retention |
| **Cross-tenant intelligence aggregates** | While peer-set has k≥10 | Discarded if peer-set falls below k | Continuously |
| **Tenant-config snapshots** | While tenant active | Last 12 snapshots for rollback | After 12 newer snapshots accumulate |

## Purge mechanism

- Postgres-backed purge job runs nightly per class.
- Soft-delete window first (for human-recoverable mistakes); hard-delete after.
- Purge action audit-logged.
- Annual purge-verification audit (sample N records, confirm hard-deleted).

## Right to erasure (GDPR Art. 17)

- Owner-initiated: via Settings → Privacy → Delete account.
- Customer-initiated (P7): via the customer's tenant Owner (we are processor; controller handles).
- Subject-initiated direct to Livia: forwarded to Owner within 24h with Owner notified.

Process:
1. Acknowledged within 30 days (GDPR Art. 12).
2. Soft-delete immediately.
3. 30-day grace period (during which Owner can restore if mistake).
4. Hard-delete day 30 — across primary DB, replicas, backups, object storage, eval traces, Sentry.
5. Audit log entry retained 1 year as proof of deletion.

## Right to portability (GDPR Art. 20)

- `POST /api/me/export` produces JSON + CSV bundle.
- Delivered via EU-only signed URL valid 24h.
- All tenant-belonging data included; nothing withheld.

## Backups + retention conflict

Backups retain everything for 30 days. After erasure request:
- Backup taken before erasure: data persists in backups for ≤30 days; restore-from-backup includes the deleted data, BUT we run a re-purge after any restore that would resurrect deleted records.
- Backups are not directly customer-accessible.

This is consistent with EDPB guidance on backups + erasure (technical erasure during backup-rotation cycle is acceptable).

## Legal hold

- If a tenant is subject to legal hold (e.g., litigation), purge is suspended for relevant data.
- Legal hold + erasure-request conflict goes to counsel.
- Legal hold notified to Owner unless prohibited by court order.

## Annual purge verification

Each year:
- Sample 100 records that should have been hard-deleted; confirm not present.
- Sample 100 records that should be active; confirm present.
- Audit log of verification kept 7 years.

## Tenant departure

Per `docs/business/competitive-response-wargame.md` "easy to leave" commitment:
- Day-of-departure: full export delivered.
- Day 1–30: tenant data marked deleted-pending; recoverable on Owner request.
- Day 30: hard-delete across all systems including object storage prefixes.
- Day 30 + 7 days: cleanup of eval traces + cross-tenant aggregates.
- Day 90: any final cleanup + audit log entry confirming.

## Annual review

Reviewed annually. Last review: 2026-05-07. Next: 2027-05.

## Open questions

- Should voice recordings retention be made tenant-configurable (e.g., 7d / 30d / 90d / off)? (Currently 30d if on; revisit per Owner demand.)
- Eval traces beyond 90d — should we offer Owner-opt-out from contributing to the long-term golden set? (Currently not — golden set is anonymised; revisit at v2.)

## EU/IRE residency

All data classes above retained in the EU/IRE region; purge happens in EU.
