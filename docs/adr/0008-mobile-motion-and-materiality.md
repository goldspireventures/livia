# ADR 0008 — Mobile motion + materiality

**Status:** Accepted (2026-05-06)
**Owners:** Mobile + Brand
**Supersedes:** N/A
**Relates to:** ADR 0004 (livia.io is the brand bible), ADR 0007 (Aurora tokens
+ gradient discipline)

## Context

The first cut of `artifacts/livia-mobile` shipped on a generic light pastel
surface, lavender accents, system fonts, and a violet→cyan gradient pill on the
primary CTA. None of this matched the brand established on `livia.io` and the
dashboard:

- Midnight surface, not pastel.
- Cormorant Garamond display + champagne italic *v*, not Inter for headlines.
- Cyan-led action color, with violet reserved for AI/automation moments.
- Gradients are reserved for AI moments only (ADR 0007).

The mobile app is the founder-facing surface businesses live in 8 hours a day —
it has the highest standard, not the lowest.

## Decision

We adopt the following non-negotiables for the mobile app, codified in code:

### 1. Dark-default surface

`useColors()` returns the **dark** palette unless the device explicitly opts
into `light`. `null` (no preference) and `dark` both resolve to the midnight
palette. The `GestureHandlerRootView` uses `#09090b` as its base so the splash
→ first-paint transition never flashes white.

### 2. Two-family typography

| Family             | Use                                                                |
|--------------------|--------------------------------------------------------------------|
| Cormorant Garamond | Display headlines, screen titles, "next up" hero, card subjects     |
| Inter              | Body, labels, eyebrows, numerics                                    |

The italic *v* in "Livia" gets the champagne gradient — never anything else.

Anchor sizes live in `constants/typography.ts`. New variants are forbidden
unless the existing ones genuinely cannot serve the case.

### 3. Single aurora halo, never three

The previous "AuroraBackdrop" stacked violet + cyan + mint orbs at fixed
positions — readable as a stock template. Replaced with `AuroraHalo`, a
single breathing radial gradient with a 4.2s breathe cycle on the UI thread.
Two halos may be composed for sign-in/onboarding to give the surface depth,
but each halo is a single soft cyan or champagne radial — never a hard pill.

### 4. Solid CTAs, gradient only for AI

Per ADR 0007, the gradient pill is reserved for moments where Liv (the AI) is
the actor. Primary CTAs (`New booking`, `Create business`, `Sign in`) are
solid `colors.primary` (cyan) with a soft cyan halo shadow — premium without
being loud.

### 5. Motion vocabulary

Three spring presets cover ~95% of motion:

```
SPRING_GENTLE  — damping 18, stiffness 140  → cards, surfaces, opacity reveals
SPRING_QUICK   — damping 22, stiffness 280  → tab/segmented indicators
SPRING_BOUNCY  — damping 11, stiffness 220  → success ticks, confirmations
```

Plus `BREATH_TIMING` for ambient halo + LivPulse, and `STAGGER_MS = 70` for
sequential card reveals.

All animations run on the UI thread via Reanimated worklets — no JS-thread
`setState` in animation paths.

### 6. Five-pattern haptic vocabulary

`useHaptics()` exposes exactly five patterns: `selection`, `tap`, `impact`,
`success`, `warning`. Web is a no-op. Failures are swallowed. Anything more
becomes noisy.

### 7. Brand presence on every primary screen

`<LiviaWordmark>` appears in the top-left of sign-in, dashboard, bookings,
customers, and more. The brand is never an afterthought.

### 8. Liv presence is one dot

`<LivPulse>` (a small concentric breathing dot) is the *only* permitted
indicator that Liv is active. No sparkle icons, no rainbow rings, no "AI"
chips on every surface.

### 9. Loading states use shimmer, not spinners

`<Shimmer>` and `<EmptyState isLoading>` provide skeletons that keep the
surface alive during fetches. Spinners are reserved for in-button work.

## Consequences

**Positive**

- Mobile finally feels like the same product as `livia.io`.
- A new screen can be built in minutes by composing the primitives — no more
  ad-hoc gradient/orb decisions per screen.
- Performance: all ambient motion runs on the UI thread; entry stagger is
  capped at 8 cards to avoid runaway timelines on long lists.

**Trade-offs**

- Cormorant Garamond adds ~120kb to the font payload. Acceptable for the
  brand fidelity gain; acknowledged here so future ADRs don't relitigate.
- Fewer gradient surfaces means fewer "wow" moments — discipline is the
  point. AI moments earn the gradient.
- Items deferred from the v1 brief (shared-element route transitions, Lottie
  illustrations for empty states, swipe-to-confirm gestures on booking rows,
  bottom-sheet business switcher) are tracked as follow-ups; they were
  intentionally deferred to ship the foundation cleanly first.

## Implementation pointers

- `artifacts/livia-mobile/constants/{motion,elevation,typography,colors}.ts`
- `artifacts/livia-mobile/hooks/{useColors,useHaptics}.ts`
- `artifacts/livia-mobile/components/brand/{LiviaWordmark,AuroraHalo,LivPulse,Shimmer}.tsx`
