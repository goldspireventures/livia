# Delivery tranches (thin vertical slices)

Each tranche ships a **user-visible or ops-visible outcome**, updates **docs** ([REPO_DELTA.md](./REPO_DELTA.md)), and ends with **green** `npm run lint` + `npm run build` (and CI when present).

## T0 — Truth

**Outcome:** Clone → env → migrate/generate → run API locally with confidence.

**Includes:** `.env.example`, README onboarding, optional `prisma/seed`, CI smoke, `.gitignore` hygiene for env example + local MCP.

**Acceptance:** New contributor can follow README without guessing secrets; CI passes on PR.

## T1 — Identity

**Outcome:** Real auth (Supabase Auth or Clerk — ADR), protected owner routes, session propagation.

**Includes:** Retire or narrow temporary `?userId=` / `actorUserId` body pattern; membership checks unchanged.

**Acceptance:** No business data accessible without valid session + membership.

## T2 — Public book

**Outcome:** Public business by slug + slot listing + anonymous or light-auth booking create.

**Includes:** Slot service (availability + time off + buffers + no double-book), rate limits, public routes **or** dedicated public prefix still scoped by `businessId` in logic.

**Acceptance:** Customer completes booking on mobile web without staff dashboard.

## T3 — Owner shell

**Outcome:** Mobile-first dashboard: upcoming bookings, lists, detail, customers, staff/services settings using existing tenant APIs.

**Acceptance:** Owner runs day without Postman.

## T4 — Notifications

**Outcome:** `NotificationLog` + one channel (e.g. email) behind a provider interface; hooks from booking lifecycle.

**Acceptance:** Booking create triggers logged outbound attempt + visible failure mode.

## T5 — AI spine

**Outcome:** `AIInteraction` (and minimal read path), shared AI client, one read-only insight or health endpoint; no autonomous mutations.

**Acceptance:** AI outage does not break booking create.

## T6 — Messaging scaffolds

**Outcome:** Webhook route stubs, env var checklist, `MessageLog` schema if ready — **no fake live** DMs.

**Acceptance:** Documented how inbound message maps to `ChannelIdentity` + customer.
