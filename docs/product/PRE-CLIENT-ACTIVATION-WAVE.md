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

## Staging for 5 clients

- `LIVIA_BETA_SIGNUP_MODE=open` on Railway staging API
- Funnel: [staging.livia-hq.com/get-started](https://staging.livia-hq.com/get-started)

## Founder verification (before clients)

1. Fresh account → shop → ribbon visible
2. Complete setup acts → publish phase shows copy/share link
3. Book test visit on public page → ribbon disappears
4. Repeat on mobile Today tab
5. `pnpm founder:uat-preflight` + staging walkthrough per vertical

## Next engineering slices (R∞ toward “big fish”)

1. `/my` + booking page competitive parity pass
2. Guest vault callouts on owner Today after activation
3. Voice/SMS one-tap provision post-activation
4. Magic migration hero on onboarding act a11
5. Bucket C founder sign-off on staging
