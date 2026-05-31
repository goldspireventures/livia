# Premium motion layer — pulse, glow, app-open delight

**Status:** canonical (2026-05-31)  
**Audience:** design, engineering  
**Purpose:** Subtle **premium energy** — crisp, bold yet soft — without carnival UI. Applies from **app open** through booking confirm.

**Parent:** [`UI-UX-MASTER-PROGRAM.md`](./UI-UX-MASTER-PROGRAM.md) · tokens in [`motion-tokens.md`](./motion-tokens.md)

---

## 1. Design intent

> **Feel alive, not loud.** Users should sense quality in the first second — a soft pulse on the logo, aurora breathing on marketing, a single shimmer on success — never looping distraction.

| Quality | Means |
|---------|--------|
| **Crisp** | Sharp type, clear hierarchy, 60fps motion |
| **Bold yet soft** | Strong CTAs with rounded radii, aurora washes not neon |
| **Premium** | Restraint — one effect per moment |
| **Exciting** | Ritual beats (open app, confirm book, proof approved) |

---

## 2. Where it applies

| Moment | World | Effect | Max duration |
|--------|-------|--------|--------------|
| **App / site open** | W1, W2, W4 mobile | Logo fade + soft scale 0.96→1 | 400ms once |
| **Marketing hero** | W1 | Aurora radial **breathe** (opacity 0.85↔1) | 8s loop, pause on reduced-motion |
| **Demo wedge select** | W2 | Card halo pulse on focus | 2s once per tap |
| **Dashboard Today load** | W4 | Stagger list + vertical accent line draw | 40ms × n, cap 8 |
| **Liv thinking** | W4, W5 | Border pulse / opacity breathe | While request in flight |
| **Booking confirm** | W5 | `success-beat` shimmer + optional chime | 600ms once |
| **Proof approve** | W5 | Checkmark scale spring + soft glow ring | 500ms once |
| **Push / alert in** | W4 mobile | Strip slide + subtle glow left edge | 300ms |

**Never:** parallax on forms, infinite shimmer on buttons, glow on every card.

---

## 3. Token extensions

Add to [`motion-tokens.md`](./motion-tokens.md) implementation:

| Token | CSS / native | Use |
|-------|--------------|-----|
| `aurora-breathe` | `@keyframes aurora-breathe` opacity | W1/W2 backgrounds |
| `logo-enter` | fade + scale | Splash / cold open |
| `halo-focus` | box-shadow pulse | W2 wedge cards |
| `liv-pulse` | border-color alternate | Chat thinking |
| `glow-success` | radial gradient fade-out | Confirm, approve |
| `accent-draw` | width 0→100% | Today vertical stripe |

All tokens **disabled** when `prefers-reduced-motion: reduce`.

---

## 4. Implementation notes

### Web (Tailwind + CSS vars)

- Glow uses `box-shadow` with brand accent at low alpha — not `filter: blur` on large containers (GPU cost).
- Aurora on marketing: pseudo-element on `body::before`, not on every section.

### Mobile (Expo)

- Splash → first frame: Reanimated `FadeIn` + light haptic on tab root mount (once per cold start).
- Use `SPRING_GENTLE` from `@/constants/motion` for sheets and success.

### `/b` public

- Mobile-first; effects must not shift layout (no scale on containers with inputs focused).
- One celebration per session on confirm — idempotent if user refreshes.

---

## 5. QA bar

- [ ] Reduced motion: all loops off; functional transitions ≤150ms
- [ ] Lighthouse: no CLS from motion on `/b` confirm
- [ ] 320px: glow does not clip CTAs
- [ ] Screen recording: looks premium at 1× speed, not busy at 0.5×

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Premium motion layer — founder direction on pulse/glow/app-open |
