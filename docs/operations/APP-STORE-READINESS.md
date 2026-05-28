# When is App Store scale “really possible”?

**“Really possible”** = a stranger downloads the app, signs up with no human support, and can run their business on **web and mobile** without hitting generic/wrong data, dead ends, or backend–frontend lies.

## Current state (2026-05-28)

| Area | Status |
|------|--------|
| Auth + empty tenant | Ready — no demo bleed on fresh signup |
| Policy-driven copy (vocabulary, playbooks) | Ready on hot paths via `GET /me/tenant-experience` |
| Onboarding blocking gates (4 essentials) | Ready — app unlock without 12-click tour |
| Activation guide post-unlock | Ready — `ActivationWelcome` web + mobile |
| Mobile catalog | Ready — fetches `/api/onboarding/catalog` |
| Mobile full wizard (hours/Liv inline) | Ready — `onboarding-setup` native blocking gates |
| Liv AI + channels | **Ops-dependent** — needs API keys for full value |
| Dashboard typecheck | Ready |
| Concierge verticals (medspa program) | **Gap** — same self-serve path; concierge mode not separate SKU |

## Definition of done (tell the founder “yes”)

All must be true:

### A. Platform contract (no mirrors)

- [x] No duplicate vertical/jurisdiction lists in mobile onboarding (catalog API); dashboard create step uses catalog API.
- [x] `TenantExperience` on owner hot paths (onboarding, home activation, mobile setup).
- [x] CI: vocabulary-leak + onboarding-program tests in api-server `test` script + platform-truth audit.

### B. Onboarding parity

- [x] Mobile can complete **all four blocking gates** without web (`onboarding-setup`).
- [ ] Test booking marked from mobile public book or staff book (activation step — optional post-unlock).
- [x] `isOnboardingAppUnlocked` + activation steps match on web and mobile.

### C. Production ops

- [ ] Staging smoke (checklist) green on every release (run `gate:production-ready`).
- [ ] Production env checklist signed (human).
- [x] `LIVIA_DEMO_ENABLED` off for production API by default (`isDemoPortalEnabled()` requires `LIVIA_DEMO_ALLOW_IN_PRODUCTION`).
- [ ] Monitoring + on-call for auth/API 5xx (human).

### D. Product completeness (anonymous user expectations)

- [ ] Liv answers at least one channel (SMS **or** web chat) with disclosure — **ops keys**.
- [x] Public booking page live for their slug after onboarding.
- [ ] Push notifications configured (APNs) for booking events — **ops**.
- [x] No placeholder / “coming soon” on day-one owner paths (onboarding, home, settings).

### E. Quality bar

- [x] `pnpm test:e2e:preflight` green (marketing + dashboard + API).
- [x] Dashboard `typecheck` green.
- [ ] Maestro or manual: iOS cold start → sign up → create medspa → glance tab → activation visible.

## Estimated tranche to reach “yes”

| Tranche | Work | Unlocks |
|---------|------|---------|
| **T1** (done) | Tenant experience API, blocking gates, activation UI, mobile catalog | Beta with support |
| **T2** (done) | Mobile blocking gate screens (`onboarding-setup`) | Mobile-only owners |
| **T3** (done) | Production gate in CI + dashboard TS fixes | Safe releases |
| **T4** | Channels + push in default activation path | “Liv works” story |
| **T5** | Concierge program flag per vertical | Medspa at scale without false self-serve |

**Founder signal:** When **T1–T3 + E** are green, say: *“Safe for App Store beta with known limits (channels).”*  
When **A–E code + ops** are green, say: *“Anonymous App Store scale — really possible.”*

## What we tell users today (honest)

- Livia is **closed beta** — self-serve setup in minutes for essentials on **web or mobile**; polish steps guided on home.
- **Channels** (SMS/WhatsApp) need provider keys — Liv still works on web chat and in-app.
- Demo data only if they choose **Load demo** or demo gateway.
