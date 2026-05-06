# ADR 0010 — Multi-tenant + persona model (Tenant axis × Role axis)

**Status:** Accepted — 2026-05-06
**Owners:** founder + engineering
**Supersedes:** N/A
**Relates to:** ADR 0002 (`businessId` scoping), ADR 0003 (Clerk for auth), ADR 0009 (roles & STAFF persona)

## Context

ADR 0002 locked tenancy at the row level: every business-scoped query carries a `businessId`. ADR 0009 added three roles (`OWNER / ADMIN / STAFF`) plus a read-only impersonation primitive (`?as=staff:<id>`). Both work in isolation. They do **not** compose correctly today — the codebase quietly conflates two unrelated mechanics:

1. **Tenant axis** — *which business's data am I currently looking at?* One Clerk user can have N membership rows, one per business.
2. **Role axis** — *what permissions do I render with inside that business?* Plus the read-only persona overlay an OWNER/ADMIN can opt into.

Symptoms of the conflation:

- The dashboard's `auth-guard.tsx` silently does `businesses[0]` and never offers a switcher. A founder running two salons literally cannot reach the second one without DevTools.
- Mobile *has* a switcher (in `(tabs)/more.tsx`, persisted via `AsyncStorage` key `livia_current_business_id`) but no surface treats `currentBusiness.id` as a first-class context — every screen just trusts the API context.
- The persona switcher (Role axis) was wired only on web. Mobile's "switch persona" UX is a no-op because `(tabs)/_layout.tsx` only branches on the user's *real* role from `useMembership()`, not on a switchable effective role.
- We have no documented answer to: "Can the same human work as STAFF at two salons under one Clerk identity?" The schema allows it (memberships are per-business); no UX or policy backs it.

We need to define both axes precisely *before* shipping more UI. This ADR is the answer.

## Decision

### Tenant axis — first-class `currentBusinessId` (client-side)

There is **no `organizations` / `accounts` table in v1.** A "founder with three salons" is just a Clerk user with three OWNER memberships. The org concept is deferred until the first design partner asks for cross-business consolidated billing or reporting (post-Gate-3).

The active tenant is a **client-side context**, not a URL segment:

- **Web:** `BusinessProvider` holds `business`, persists chosen `id` to `localStorage["livia.currentBusinessId"]`, and exposes `setBusiness()`. `auth-guard.tsx` resolves it on mount: persisted-id-if-still-a-member > first OWNER membership > first membership.
- **Mobile:** `BusinessProvider` already holds this; we standardise the storage key to `livia.currentBusinessId` (with a one-shot migration from `livia_current_business_id`).
- **Server:** the URL stays `/businesses/:businessId/...`. The client always reads `currentBusiness.id` to build URLs. We do **not** introduce `/b/:slug` URL routing in v1 — it would require touching every dashboard route and offers no user-visible win.

#### Membership state machine

| # of memberships | Behaviour |
|---|---|
| 0 | Redirect to `/onboarding` (web) / OnboardingStack (mobile). |
| 1 | Silent select. No switcher chrome. |
| ≥ 2 | Switcher must be visually present at all times: web = top-of-sidebar pill; mobile = sticky chip on header of every tab + full-screen sheet from the existing More card. |

#### Roles compose per-business, not globally

`business_memberships(role)` is the single source of truth. A user can be `OWNER` of business A and `STAFF` of business B in the same session. Every read/write resolves role via `resolveMembership(userId, businessId)`. There is no "global role." This is already how `requireRole` works today (per ADR 0009); this ADR codifies it as policy.

#### Cross-business data sharing: forbidden

Customer rows, conversation rows, AI training, and analytics never traverse `businessId`. A founder who owns A and B sees A's customers when in A and B's customers when in B — full stop. Each business is a separate GDPR data controller relationship (see `docs/policy/tenancy-and-billing.md`). Cross-business *aggregation* (e.g. "founder dashboard summing revenue across all my shops") is a deliberate, separately-audited surface that is **not in v1.**

#### Billing scope

Billing in v1 is per-business (Task #58 / Lane 4 L7). One Stripe Customer per `businesses` row. A founder running three shops sees three subscriptions. Org-level rollup billing is deferred. This is documented in `docs/policy/tenancy-and-billing.md`.

### Role axis — keep ADR 0009 verbatim, add three rules

ADR 0009 is signed and stays unchanged. This ADR adds:

1. **Persona switcher is OWNER/ADMIN-only and read-only.** No new role can opt in. STAFF cannot impersonate. (Already enforced in `auth.ts` — codified here as policy.)
2. **Persona switcher is per-business.** When the tenant switches, the persona is dropped. (Already implemented in `membership-context.tsx`.)
3. **Persona switcher must be auditable.** Every request that carries `?as=staff:<id>` is logged to a new `audit_log` table (schema + retention specified in `docs/policy/impersonation-audit.md`). The audit table is the legal record that an OWNER did or did not look at a STAFF's slate during a given window. Without it, "you can preview staff" is a liability rather than a feature.

### Impersonation vs delegation

These are different things and the UI must say so:

- **Delegation** = giving another human a real membership (`POST /businesses/:bid/invitations` with a role, per ADR 0009). Persistent. Bilateral.
- **Impersonation** = an OWNER/ADMIN previewing the app *as if* a specific STAFF, bounded to GET requests. Ephemeral. Unilateral. Audited.

Impersonation is **never** a substitute for delegation when the action requires writes. The 403 with `code: "PERSONA_READ_ONLY"` (already in `auth.ts`) is the bright line.

### One human at two salons

Yes — supported. The Clerk user is the bridge:

1. Salon B's owner invites `staff@example.com` with role STAFF.
2. Clerk recognises the existing user; the invitation lands in their account.
3. On next sign-in, `POST /me/accept-invitations` materialises a second `business_memberships` row.
4. Both businesses now appear in the user's switcher. Each tenant sees a separate `staff` row (one per business).

The `staff` table stays per-business — there is **no** shared "professional profile" across tenants. A stylist's bio at salon A is unrelated to her bio at salon B; her customers at A are unrelated to her customers at B. Full details in `docs/policy/staff-multi-employment.md`.

## Consequences

**Wins**

- A founder running multiple shops can finally reach all of them.
- The two axes (tenant + role) are documented as orthogonal and the codebase can stop conflating them.
- Cross-business data leaks are impossible by construction (no shared keys, no shared tables, audit log catches impersonation).
- The persona switcher becomes a defensible compliance feature (audited) rather than a hidden footgun.

**Costs**

- Web dashboard needs a real business switcher in the sidebar (follow-on build task).
- We must ship the `audit_log` table + endpoint *before* we ship the persona switcher to design partners (currently shipped). Until that lands, the switcher is "internal-eyes only."
- Mobile theme inconsistency (light vs dark depending on `useColorScheme()` returning null) gets fixed in ADR 0011 — it's flagship-level and out of scope here.
- We accept some duplication: a founder with two shops re-enters AI tone, branding, hours per business. We do **not** offer "copy settings to my other shop" in v1.

**Things explicitly NOT in scope (deferred post-Gate-3)**

- Org-level entity (`organizations` table, org-level OWNER above per-business OWNER).
- Cross-business consolidated billing.
- Cross-business consolidated reporting / analytics.
- URL-based tenant routing (`/b/:slug/...`).
- Shared "professional profile" for staff across multiple salons.
- New roles beyond OWNER/ADMIN/STAFF (FRONT_DESK, ORG_OWNER, etc).

## Migration

This ADR is mostly *codifying* existing behaviour with two small client changes (web business switcher, audit log writes). No schema migration. The new `audit_log` table is additive (separate follow-on task #B).

## References

- `lib/db/src/schema/businesses.ts` — `businesses`, `business_memberships`, `membership_role` enum.
- `artifacts/api-server/src/lib/auth.ts` — `resolveMembership`, `requireRole`, persona override.
- `artifacts/livia-dashboard/src/lib/business-context.tsx` — current tenant context.
- `artifacts/livia-mobile/contexts/BusinessContext.tsx` — current tenant context.
- `docs/policy/tenancy-and-billing.md` — per-business billing posture + cross-business sharing rules.
- `docs/policy/impersonation-audit.md` — audit row shape + retention.
- `docs/policy/staff-multi-employment.md` — one human, N salons.
- `docs/personas.md` — the seven personas this model serves.
