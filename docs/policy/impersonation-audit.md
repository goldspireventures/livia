# Policy — Impersonation audit

**Status:** v1 (2026-05-06)
**Anchors:** ADR 0009 (roles & STAFF persona), ADR 0010 (persona switcher contract).

## Why this exists

ADR 0009 ships a read-only persona switcher: an OWNER or ADMIN can append `?as=staff:<id>` to any URL and see the app as a specific STAFF would. It's a useful empathy / debugging / training tool. Without an audit log, it's also a liability:

- A staff member has no way to know whether her boss spent two minutes or two hours combing through her client roster on Sunday night.
- We have no defence against "I never looked at your data" disputes.
- GDPR Art. 32 expects access controls *and the ability to demonstrate them*.

This policy makes the switcher legitimately defensible by recording every use and giving the impersonated person visibility into it.

## What gets logged

Every request that carries a `?as=staff:<id>` parameter and survives `requireRole`'s OWNER/ADMIN gate writes one row to `audit_log`:

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | nanoid. |
| `businessId` | text FK → businesses | scoped per tenant — never cross-tenant. |
| `actorUserId` | text FK → users | the OWNER/ADMIN who initiated impersonation. |
| `actorRole` | enum | `OWNER` or `ADMIN`. |
| `actingStaffId` | text FK → staff (nullable) | the STAFF row being viewed-as. Null when `?as=staff` (no specific id). |
| `route` | text | the path, normalised (`/api/businesses/:businessId/bookings`). |
| `method` | text | `GET` / `HEAD`. (Mutations are blocked by `auth.ts`.) |
| `userAgent` | text | for forensic differentiation between the dashboard and the mobile app. |
| `ipAddress` | text | IPv4/IPv6, hashed at rest with a per-business salt to keep the log GDPR-minimal. |
| `createdAt` | timestamptz | indexed. |

Indexes: `(businessId, actingStaffId, createdAt desc)` and `(businessId, actorUserId, createdAt desc)`.

This is the *only* table in v1 that audits impersonation. We do not log every read in non-impersonated mode — that's a future SIEM concern.

## Retention

- Live retention: **90 days** of full rows.
- Archive retention: aggregated counts (per `(businessId, actorUserId, day)`) for **1 year** in a separate `audit_log_daily` table for trend analysis.
- After 1 year, fully purged.

This balances the practical need (a staff member can ask "what did my manager look at last quarter?") against minimisation.

## Who can read the log

- **OWNER** of the business: full audit log for the business.
- **ADMIN**: their own actions only (so an ADMIN can verify what *they* viewed-as, but cannot surveil a peer ADMIN).
- **STAFF**: a *summary* of impersonation events that targeted them — date, actor name, count of routes viewed. Never the full route list (that would expose internal product structure).
- **Customers**: never (customers don't have accounts).
- **Livia engineering**: read access only via support tooling, with our own audit trail.

The summary surface for STAFF lives at `Settings → Privacy → Who has viewed my day` on web (Gate 3) and gets an in-app digest push on mobile every Monday morning ("Your manager viewed your day 3 times last week — review").

## Notification posture

We pick **transparency by default, opt-out** rather than opt-in:

- Every STAFF gets the weekly digest unless they turn it off in Settings → Notifications.
- The first time an OWNER/ADMIN uses persona switcher in a given business, the affected STAFF gets a one-time onboarding push: "Heads up — Niamh just used the new staff-view feature to look at your day. You can review or turn off these alerts in Settings."
- This is not malicious-actor protection — it's trust-building. A founder who's afraid of staff seeing the log shouldn't be using impersonation.

## Read-only enforcement (already in code)

`auth.ts` rejects any non-GET / non-HEAD request that carries `?as=staff:<id>` with `403 PERSONA_READ_ONLY`. This is the bright line: impersonation can never write. Audit log captures only reads, because writes are impossible.

## Implementation status

- [x] Read-only enforcement — shipped via Task #48 (ADR 0009).
- [ ] `audit_log` table + middleware writes — follow-on build task (proposed at end of #59).
- [ ] STAFF-side summary surface — follow-on build task (Gate 3).
- [ ] Weekly digest push — follow-on build task (depends on N1 push notifications, ADR 0011).

The persona switcher remains feature-flagged to "internal-eyes only" until the audit table lands.

## EU/IRE residency

`audit_log` lives in the same EU/IRE Postgres as the rest of tenant data. No third-party SIEM in v1 (deferred until SOC 2 readiness work picks up — Compliance C11).
