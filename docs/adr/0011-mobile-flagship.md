# ADR 0011 — Mobile is the flagship surface

**Status:** Accepted — 2026-05-06
**Owners:** Mobile + founder
**Supersedes:** N/A
**Relates to:** ADR 0007 (Aurora tokens & gradient discipline), ADR 0008 (mobile motion + materiality), ADR 0009 (roles & STAFF persona), ADR 0010 (multi-tenant + persona model)

## Context

Livia's customers — Dublin appointment-based shop owners and their staff — live on their phone for eight hours of every working day. The web dashboard is a back-office surface (catalogues, billing, training the AI, monthly reports). The mobile app is the cockpit the chair-renting stylist holds in her hand between blow-dries.

Today the mobile app is the *opposite* of that. A parity audit (see Appendix A) shows it covers roughly **30%** of the surfaces a daily-use OWNER touches on web, and **0%** of the native capabilities a 2026 iPhone affords:

- Mobile is missing: Inbox, Settings, AI configuration, Communications, full create flows for customers/staff/services, KPI depth, public-page preview.
- Mobile uses **none** of: push notifications, biometrics, Live Activities, widgets, on-device search, offline reads, camera-for-photo, location, the haptic tier we already own.
- Theme is unstable: when `useColorScheme()` returns `null` (Replit web preview, some Android states) the app falls back to dark in some screens and light in others. Demo viewers see two different apps.

This ADR sets the mobile north star and locks the rules every future mobile task will be measured against.

## Decision

### North star

> **The phone is where Livia is alive. The web is where Livia is configured.**

If a feature is part of the daily workflow of an OWNER, ADMIN, or STAFF — booking management, customer interactions, the AI inbox, day-of operations, money-in moments — it belongs on mobile, period. If it's a quarterly or one-time configuration — AI training, billing, brand, staff catalogues, reports — it can stay web-only.

### Parity target — ≥ 70% (defined precisely)

Parity is **not** "every screen on web exists on mobile." Parity is:

- **100%** of OWNER/ADMIN daily-use surfaces ship on mobile in some form.
- **100%** of STAFF surfaces ship on mobile in some form (STAFF is mobile-only as a deliberate product choice).
- **≥ 70%** of all OWNER/ADMIN surfaces ship on mobile (the remaining ≤ 30% are explicitly listed below as web-only).

The parity audit (Appendix A in `docs/personas.md`) is the scorecard. We re-score at the start of every Monday operating cadence until we pass 70%, then again at Gate-3.

### Web-only surfaces (deliberate)

These will not be built on mobile in v1 because the input affordance, screen size, or frequency makes mobile the wrong tool:

- AI training wizard (long-form text editing, prompt iteration).
- Multi-column reports / cohort analytics / financial export.
- Stripe billing portal (sensitive money configuration; Stripe's own portal is web-first).
- Bulk customer / service / staff imports (CSV).
- Brand / marketing-site mockup gallery.
- Public-page editor (drag/drop sections; phone is a fine place to *preview*, not to *edit*).

Everything else ships on mobile.

### Native-only differentiators (in scope for Gate 2 / 3)

These are the wow moments. Each gets its own follow-on build task, but the ADR locks them as in-scope, not aspirational.

| # | Capability | What it does | Stage |
|---|---|---|---|
| N1 | Push notifications | "Liv just booked Mary M. for €60." / "Sarah cancelled — your 14:00 is free." / "Inbox: a customer is waiting." | Gate 2 |
| N2 | Biometrics | Face ID / Touch ID re-auth gate before viewing revenue, before approving a refund, before opening Settings. | Gate 2 |
| N3 | Live Activities (iOS) | Persistent island/lock-screen card counting down to your next booking, with one-tap to "I've started." | Gate 3 |
| N4 | Widgets (iOS + Android) | "My Day" glance — next booking + revenue today; refreshes every 15 min. | Gate 3 |
| N5 | Offline reads | Last-fetched cockpit, today's bookings, today's customers, last 30d inbox usable on the Tube; writes queue with conflict UI. | Gate 3 |
| N6 | Camera | Take before/after photos attached to a booking or customer note; stored in Replit Object Storage. | Gate 3 |
| N7 | Location | Opt-in auto check-in when staff arrives at the shop's geofence; opt-in customer arrival pings. | Post-G3 |
| N8 | Haptics tier | Already partially shipped (`useHaptics`). Audit and standardise: selection / tap / success / warning / error tiers, never a buzz without semantic meaning. | Gate 2 |

Apple Watch + complications are explicitly **out of scope** for v1 — too much surface for too few wearers in our beta cohort. Revisit at Gate 3 + 1.

### Theme rule (the one true source)

The current bug: `colorScheme !== "light"` is used in some places (defaults to dark on `null`), `colorScheme === "dark"` in others (defaults to light on `null`). On Replit's web preview `useColorScheme()` returns `null` and the app shows two different palettes on the same screen.

**Decision:**

1. There is **one** colour resolver: `useColors()`, backed by `constants/colors.ts`.
2. The app's *brand default* is **dark** ("Aurora Midnight" — locked in ADR 0008). When `useColorScheme()` returns `null` we render **dark**.
3. We honour `useColorScheme()` strictly when it returns a non-null value. Users who set their device to light see Aurora Day; users on dark see Aurora Midnight.
4. No screen, no component, no inline style is allowed to read `useColorScheme()` directly. Always go through `useColors()`. CI grep guard added in the follow-on theme-audit task.

This eliminates the iOS-dark / Replit-light split.

### Demo gateway is a flagship feature

The mobile app must support the persona-launcher described in `docs/demo-gateway.md`. Without it, the founder cannot demonstrate STAFF-vs-OWNER reality on a single device. The launcher is an in-app surface, gated to demo Clerk users, and audited (see policy pack).

### Performance bar

- Cold start to first interactive frame: ≤ 2.0s on a 2-year-old iPhone (iPhone 13).
- Tab switch to first paint: ≤ 200ms.
- Pull-to-refresh on cockpit: ≤ 600ms p50 on Wi-Fi.
- Bundle size: ≤ 25MB initial install.

These are non-negotiable; if a feature regresses any of them it doesn't ship until the regression is fixed.

## Consequences

**Wins**

- A demo viewer holding the founder's phone sees a complete, native-feeling product, not a web companion.
- Staff onboarding gets a real product to walk into — STAFF is a first-class mobile persona, not a degraded OWNER view.
- The phone gets the reliability dividend (offline, push, biometrics) that desktop browsers can never match.

**Costs**

- Substantially more mobile work between now and Gate 3 — see `docs/mobile-roadmap.md` for the phased plan.
- Some web surfaces (Inbox, Settings) need to ship a mobile twin instead of being "use the web."
- We explicitly take on Live Activity / widget complexity, which means iOS-native modules and Expo dev-client builds (no more Expo Go for full feature testing).

**Things explicitly NOT in scope**

- Apple Watch app, complications, watchOS Liv shortcuts.
- Android Wear / Wear OS.
- Tablet-optimised layouts (iPad-as-front-desk is a salon dream we will revisit at Gate 3 + 1).
- Mobile-side admin of billing, AI training, or brand assets — those stay web.

## Appendix A — Parity audit (snapshot 2026-05-06)

Detailed table lives in `docs/mobile-roadmap.md`. Headline numbers:

- OWNER daily-use surfaces present on mobile: **6 / 14** ≈ 43%.
- STAFF surfaces present on mobile: **2 / 4** = 50%.
- Native goodies in production: **0 / 8**.

Target by end of Gate-2: 70% / 100% / 4 of 8.

## References

- ADR 0007 — Aurora tokens & gradient discipline.
- ADR 0008 — Mobile motion + materiality.
- ADR 0009 — Roles & STAFF persona.
- ADR 0010 — Multi-tenant + persona model.
- `docs/personas.md` — who lives in this app.
- `docs/mobile-roadmap.md` — phased plan to reach the north star.
- `docs/demo-gateway.md` — persona-launcher spec.
- `artifacts/livia-mobile/constants/colors.ts` + `hooks/useColors.ts` — the one true colour source.
