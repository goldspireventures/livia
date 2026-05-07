# Design system

**Status:** F8 (2026-05-07). Lives in `packages/design-tokens/` + `packages/ui/`. Reads with ADR 0007 (Aurora tokens) and ADR 0008 (mobile motion).

## What's already locked

- **Palette.** Aurora-Midnight dark only. Tokens in `packages/design-tokens/`.
- **Type anchor.** Cormorant Garamond serif (display + headings); Inter (body, UI).
- **Mobile materiality.** Per ADR 0008.
- **Gradient discipline.** Per ADR 0007.

## What this doc adds

### Type scale + voice principles

| Role | Family | Size (web / mobile) | Use |
|---|---|---|---|
| Display | Cormorant Garamond | 56/40 | hero, brand moments, ritual surfaces |
| H1 | Cormorant Garamond | 40/32 | page titles |
| H2 | Cormorant Garamond | 32/24 | section titles |
| H3 | Inter | 20/18 | sub-section, briefing-card titles |
| Body | Inter | 16/16 | running prose, briefing copy |
| Body small | Inter | 14/14 | secondary, captions, audit-log entries |
| Code / data | JetBrains Mono | 14/13 | log timestamps, IDs, technical data |

**Voice register codified:**
- Liv-for-Owner copy: imperative, calm, dry-warm. Avg sentence ≤14 words.
- Liv-for-Manager copy: collegial, declarative.
- Liv-for-Customer copy: warm, generous, never servile. "I" not "we."
- Marketing copy: confident, European, never bro-tech, never "10x your revenue."

Lint rules where automatable (sentence-length cap; banned words; emoji rules).

### Motion language

The "ritual" choreography per ADR 0008. Three motion signatures, used consistently across surfaces:

| Signature | Easing | Duration | Use |
|---|---|---|---|
| **Briefing** | spring(stiffness=120, damping=18) | 600ms | morning briefing card entry; weekly digest reveal |
| **Decision** | cubic-bezier(0.2, 0.8, 0.2, 1) | 280ms | refund-cap-ladder, approve/decline, scope-grant |
| **Drift** | cubic-bezier(0.4, 0, 0.2, 1) | 400ms | drift-recovery, "Liv was wrong" rollback, gentle reveal |

Stagger rules: 60ms between siblings for briefing-class; 30ms for decision-class; 80ms for drift-class.

### Liv's character bible

(Delegated to `docs/company/brand-of-livia-and-liv.md` for tone of voice; here we capture the *visual character*.)

- **Avatar.** No anthropomorphic avatar. Liv is represented by a typographic mark — her name set in Cormorant Garamond italic — and a state indicator (a pulsing point with three states: listening, thinking, responding).
- **Listening.** A 1.5s gentle pulse, ~12px. Indicates voice or text capture in progress.
- **Thinking.** An indeterminate progress mark; a slow shimmer across the typographic mark; never a spinner.
- **Responding.** A typewriter cadence for text; a steady waveform for voice; both honour Liv's pacing (short sentences, brief pauses).
- **Apology.** When Liv was wrong — a brief amber tint to the typographic mark, fading to default in 800ms. Never overdone.

### Component library

Lives in `packages/ui/`. Cross-platform (web + RN) where possible; platform-specific implementations otherwise.

**Primitives:**
- `Button` (primary, secondary, ghost, destructive)
- `Card` (briefing, decision, drift, neutral)
- `Sheet` (mobile bottom-sheet; desktop modal)
- `Modal` (decision-bound, dismissable, persistent)
- `Field` (text, select, date, time, money, scope)
- `Toggle`, `Checkbox`, `Radio`
- `Toast` (transient feedback)

**Liv-specific:**
- `BriefingCard` — the morning briefing surface; 3-state (loading, content, error)
- `RefundLadder` — the cap-bound refund control with escalation path visible
- `DepthRungIndicator` — the R1–R5 indicator for the Owner cockpit
- `LivStateIndicator` — the listening/thinking/responding/apology mark
- `AuditLogEntry` — single-row audit log display
- `ScopeGrant` — the scoped permission control (for ADM-D, time-off, etc.)
- `DraftReview` — the "Liv drafted; you approve" surface

### States as first-class

Empty, loading, error, "Liv was wrong" — designed once, reused everywhere.

| State | Tone | Visual cue |
|---|---|---|
| Empty | Generous | "Nothing here yet — when [thing happens], you'll see it." |
| Loading | Patient | LivStateIndicator (thinking) + skeleton |
| Error | Honest | "Something didn't go right. Liv noted it; we'll be back online shortly." + retry |
| Liv was wrong | Direct | Amber tint + "I got this wrong. Here's what I did. Roll back?" + one-tap remedy |
| Offline | Calm | "You're offline. What you see is the last known state." |

### Photography + illustration rules

**What Livia is visually:**
- Real European salon interiors at quiet moments (Tuesday morning light; not the Saturday crush).
- Hands at work, not faces (consent-aware; non-objectifying).
- Real text on screens (not lorem ipsum); shot at angles that show the data, not the bezel.

**What Livia isn't:**
- No stock-photo "diverse team smiling at laptop."
- No stylised vector "characters" representing personas.
- No iPhone-pristine product shots; we show the wear of real use.
- No tech-bro aesthetics (no fluorescent green, no anime, no glitch effects).

## Governance

- All new components land via PR with a Storybook entry + dark-mode screenshot + RN+web parity check (where applicable).
- Design tokens are versioned; breaking changes require ADR.
- The system grows from real product needs, not from speculation.

## What this earns us

Visual coherence across 5 artifacts (marketing, dashboard, mobile, API surfaces, sandbox) and across 8 personas × 4 modalities, without engineers or designers re-inventing per surface. The category commitment ("operator-as-a-service") needs visual coherence to feel like a single product.
