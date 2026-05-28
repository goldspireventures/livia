# Livia motion tokens (v3)

**Canonical UX:** [`../product/V3-EXPERIENCE-SPEC.md`](../product/V3-EXPERIENCE-SPEC.md)

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
