# Build backlog

> **Archived** — see [`../archive/README.md`](../archive/README.md). **Active build:** [`OPERATION-SOLIDIFY.md`](./OPERATION-SOLIDIFY.md).

> **Superseded for active work** by [`OPERATION-SOLIDIFY.md`](./OPERATION-SOLIDIFY.md) and [`../operations/PLATFORM-BACKLOG.md`](../operations/PLATFORM-BACKLOG.md). Historical checklist from master design to shipped truth.

**Status:** **Closed for in-repo scope** (2026-05-22). Use [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md) for off-platform gates and [`LIVIA-PRODUCTION-READY.md`](./LIVIA-PRODUCTION-READY.md) for the live-user narrative.

**Execution authority:** [`LIVIA-MASTER-BUILD-PLAN.md`](./LIVIA-MASTER-BUILD-PLAN.md)

## Doc / governance

- [x] ADR: multi-surface architecture — `docs/adr/0019-multi-surface-architecture.md`
- [~] Founder sign-off on `LIVIA_MASTER_DESIGN.md` — **human gate**, not engineering
- [~] Full-sector public launch RFC — **deferred** to v1.5 unless founder reopens scope

## Liv OS (architecture)

- [x] Tool registry + `resolveLivTools`
- [x] Vertical pack JSON + prompt templates
- [x] `pendingReason` on bookings + `derivePendingReason`
- [x] Event reaction registry
- [x] Staff inbox reply API + dashboard + **mobile** composer
- [x] `send_message` tool (staff profile)
- [x] Operational policy UI (deposit, buffer, cancel window, no-show)
- [~] `db push` + codegen on **deploy machines** — ops step per release
- [~] Versioned prompt store (DB/S3) — v1.5; TS templates sufficient for beta
- [~] Internal Liv copilot depth — MVP at `livia-internal` + `internalLivAssist`

## UX audit (2026-05-21)

**Source:** [`UX-AUDIT-2026-05-21.md`](./UX-AUDIT-2026-05-21.md) — **closed in code.**

- [x] Second-shop onboarding (`?intent=second-shop`)
- [x] Glance → switch tenant + Today + toast
- [x] Inbox staff composer + API
- [x] New booking dialog (legacy `/bookings/new` redirects)
- [x] Audit pagination + search + filters
- [x] Customer channel identity merge UI
- [x] Logo URL + media assets API
- [x] Multi-structure spec — [`MULTI-STRUCTURE-SCENARIOS.md`](./MULTI-STRUCTURE-SCENARIOS.md)
- [x] Persona headers per surface
- [x] Onboarding deep links + back-button fix + deduped CTAs

## Integrity (P0)

- [x] Mobile approvals (live PENDING)
- [x] NEXT UP / TZ-aware today
- [x] Reschedule honest handoff
- [x] Native booking picker + validation
- [x] Persona model (no customer persona in tenant app)
- [x] Locale from business timezone

## Internal (Livia Inc)

- [x] `artifacts/livia-internal` + tenant directory + support tickets + Liv assist

## Parity (ADR 0011)

- [x] Mobile inbox threads + take-over + **staff reply**
- [x] Mobile settings (Liv, comms, legal)
- [x] Push registration (N1) + biometric gates (N2) on sensitive mobile surfaces

## Staff scheduling (v1.5+)

- [ ] Schema + API + UI — **post-wedge RFC** (not beta-blocking)

## Screen inventory

- [x] `pnpm inventory` → `SCREEN-INVENTORY.md`
