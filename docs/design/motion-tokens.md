# Livia motion tokens (v3)

**Canonical UX:** [`../product/V3-EXPERIENCE-SPEC.md`](../product/V3-EXPERIENCE-SPEC.md) · full catalog §3.2 in [`UI-UX-MASTER-PROGRAM.md`](./UI-UX-MASTER-PROGRAM.md)

## Web (Tailwind `animate-in`)

| Token | Classes |
|-------|---------|
| `enter-page` | `animate-in fade-in slide-in-from-bottom-4 duration-500` |
| `enter-panel` | `animate-in fade-in slide-in-from-right-4 duration-300` |
| `success-beat` | `celebrate-shimmer` (+ optional chime — see public booking) |

## Mobile (Expo)

| Token | Constant |
|-------|----------|
| `spring-gentle` | `@/constants/motion` → `SPRING_GENTLE` |

## Rules

- Respect `prefers-reduced-motion` and user opt-out before sound or shimmer.
- One celebration beat per booking confirm — not on every navigation.

## Premium layer (pulse / glow / app-open)

Full spec: [`PREMIUM-MOTION-LAYER.md`](./PREMIUM-MOTION-LAYER.md)

| Token | Web class / keyframes | Use |
|-------|----------------------|-----|
| `aurora-breathe` | `@keyframes aurora-breathe` on hero pseudo | W1/W2 background |
| `logo-enter` | `animate-in fade-in zoom-in-95 duration-400` | Cold open / splash |
| `halo-focus` | `shadow-[0_0_24px_-4px_var(--accent)]` pulse once | W2 wedge card |
| `liv-pulse` | `animate-pulse` on border only | Liv thinking |
| `glow-success` | radial gradient overlay fade 600ms | Confirm / approve |
| `accent-draw` | width transition on vertical stripe | Today load |
