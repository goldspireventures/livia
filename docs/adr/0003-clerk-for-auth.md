# ADR 0003: Clerk for authentication (web + mobile)

- **Status:** Accepted (2026-03, pre-rename — re-affirmed 2026-05-06).
- **Deciders:** founder.

## Context

We need authentication that supports: email + password, Google OAuth (the dominant sign-up flow for shop owners), Apple OAuth (App Store policy), session management on web, native session management on mobile, magic links for invitations, and a UI surface that doesn't look like a 2014 form. We also need a hosted user database we trust to handle GDPR-deletion requests cleanly.

Three options were on the table: Clerk, Replit Auth (built-in OIDC), and rolling our own with `lucia-auth` + Postgres + a custom OAuth dance.

## Decision

**Clerk** — for web and mobile, with Google as the primary sign-up path. Web uses `@clerk/clerk-react` with Clerk-hosted UI components. Mobile uses a **custom sign-in screen** built against `@clerk/clerk-expo` (Clerk's hosted UI is not premium enough for our brand) with Google OAuth via `livia-mobile://oauth-callback` (and `bliq-mobile://` retained as a second redirect URI for in-flight OAuth — see ADR 0001).

## Consequences

- One user database, two SDKs. Sessions are first-class on both platforms.
- The dashboard delegates the entire sign-in / sign-up / password-reset / SSO flow to Clerk-hosted components, themed to match the brand (serif headlines, single cyan halo, top-left wordmark — see ADR 0007).
- Mobile owns its sign-in surface — premium polish is non-negotiable on the mobile app, and Clerk's hosted UI is a downgrade there.
- Clerk JWTs are verified in the API server via `@clerk/express`; the verified user id is mapped to a `businessId` per the multi-tenancy rules in ADR 0002.
- We accept Clerk's per-MAU pricing and the vendor-lock-in risk. Migration off Clerk would be a meaningful project but well-scoped (one auth provider, one set of integrations).
- GDPR delete requests route through Clerk's user-delete API plus a soft-delete on our own `users` row (Compliance C4).
- Two Clerk redirect URIs and two Google OAuth allow-lists need to stay in sync as we add platforms — tracked as a launch-ops follow-up.

## Alternatives considered

- **Replit Auth.** Rejected — couples our identity layer to the dev platform, and the mobile story is weaker.
- **Roll our own (`lucia-auth` + custom OAuth).** Rejected — the founder's time is better spent on AI behaviour and brand than on session management. Re-evaluate if Clerk pricing becomes the binding constraint.
