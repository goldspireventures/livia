# Pre-client activation wave

**Status:** active (2026-06-21)  
**Goal:** Every design partner hits **first booking** without founder hand-holding.  
**Sacred metric:** first guest booking on the shop's public link.  
**Policy:** `lib/policy/src/go-live-program.ts` · `setup-guided-flow.ts`

---

## Owner journey (what we ship)

```text
Marketing /get-started → Clerk sign-up → Create shop → Onboarding acts
  → Go-live ribbon (web + mobile) until first booking
  → Share booking link → Guest books → Activated
  → Optional: billing, SMS/voice, retail add-on
```

## Go-live ribbon (4 phases)

| Phase | What | Blocks go-live? |
|-------|------|-----------------|
| Set up shop | Profile, hours, menu, Liv | Yes |
| Publish booking page | Slug + public link | Yes |
| First booking | Sacred metric | Yes |
| Billing | Plan / beta note | **No** — optional, after activation |

Billing no longer sits between publish and first booking.

## Surfaces

| Surface | Component |
|---------|-----------|
| Dashboard (all owner pages) | `GoLiveRibbon` in app layout |
| Settings → Liv | `LivSetupGuidedFlow` |
| Mobile Today | `SetupGuidedFlowCard` |
| Lifecycle | `ActivationFunnelPanel` |

## Registration integrity (2026-06-21)

New sign-ups must **never** land in demo tenants (e.g. Dublin Barber Collective).

- Policy: `registration-routing-program.ts` — filter demo slugs, owned-shop routing
- API: `GET /me/businesses` strips demo worlds for non-demo emails
- Dashboard: clears tenant localStorage + React Query cache on sign-out / account switch
- Legal acceptance → `/onboarding` unless user **owns** a shop with onboarding complete


- `LIVIA_BETA_SIGNUP_MODE=open` on Railway staging API
- Funnel: [staging.livia-hq.com/get-started](https://staging.livia-hq.com/get-started)

## Founder verification (before clients)

1. Fresh account → shop → ribbon visible
2. Complete setup acts → publish phase shows copy/share link
3. Book test visit on public page → ribbon disappears
4. Repeat on mobile Today tab
5. `pnpm sacred-path:signup` (automated sign-up path) + `pnpm founder:uat-preflight` + staging walkthrough per vertical

**Engineering closure (2026-06-21):** web visual/axe gates green; sacred-path signup E2E wired; mobile `SetupGuidedFlowCard` uses same `testBooking` checklist. Remaining: founder Bucket C sign-off + production secrets/DNS.

## Next engineering slices (R∞ toward “big fish”)

1. `/my` + booking page competitive parity pass
2. Guest vault callouts on owner Today after activation
3. Voice/SMS one-tap provision post-activation
4. Magic migration hero on onboarding act a11
5. Bucket C founder sign-off on staging
