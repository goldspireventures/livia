# Accessibility

**Status:** v1 (2026-05-07). Reads with `docs/engineering/design-system.md`.

## Target

**WCAG 2.2 Level AA** for all customer-facing surfaces (booking widget, marketing site) and Owner cockpit. **AAA aspirational** for the customer booking widget specifically (the most public surface).

For mobile, **iOS HIG accessibility** + **Android Material accessibility** baselines, plus our additions.

## Why this matters to Livia

Our customers' customers include older salon clients, low-vision users, motor-impaired users, screen-reader users, and people on poor connections in salon back-rooms. The booking widget is often used one-handed, on small screens, in low light, with bad reception. Accessibility is part of the brand commitment to "calm, present, deliberate" — anything else is theatre.

## The non-negotiables

1. **Keyboard-only navigation** for every web surface. Visible focus rings (per design tokens).
2. **Screen-reader labels** for every interactive element. Form fields have associated labels. Buttons have descriptive text or `aria-label`.
3. **Colour contrast** ≥4.5:1 for body text; ≥3:1 for large text and UI components. (Aurora-Midnight is dark-only; verified.)
4. **Reduced motion** respected via `prefers-reduced-motion`. Liv's "thinking" shimmer + "briefing" entry motion soften when user prefers reduced motion. Per design system motion language.
5. **Touch targets** ≥44×44pt on mobile (iOS HIG); ≥48×48dp on Android.
6. **Text resizing** to 200% without loss of function.
7. **Live regions** for Liv responses (so screen-reader users hear Liv's reply when it arrives without re-focusing).
8. **Voice receptionist** is itself an accessibility surface — someone who can't read a booking widget can speak to Liv.

## Per-surface specifics

### Customer booking widget (the most public)
- Single-column responsive flow (works at 320px width).
- All form fields keyboard-traversable in DOM order.
- Date/time picker has a fallback `<input type="date">` for screen-reader / older-browser users.
- Submission states announced via `aria-live`.
- Error messages associated with fields via `aria-describedby`.
- AAA target: contrast ≥7:1; line-height ≥1.5; paragraph spacing ≥2× line-height.

### Owner cockpit (web)
- Briefing card uses semantic landmarks (`<main>`, `<aside>`, `<nav>`).
- Audit log search uses `<table>` with `<caption>` and proper `<th>` scope.
- Refund-cap-ladder is a labelled `<form>` with explicit step indicators.
- Mobile-first responsive; cockpit usable at 360px.

### Mobile flagship
- Dynamic type respected (iOS Text Size + Android Font Size).
- VoiceOver / TalkBack labels for every interactive element.
- Custom gestures have UIKit / Android system equivalents.
- Live Activities (ADR 0011 N3) include screen-reader text.

### Marketing site
- Skip-to-content link.
- Heading hierarchy correct (one `<h1>`; no skipped levels).
- Images have meaningful `alt` text or empty `alt=""` for decorative.
- Video (founder demo) has captions + transcript.

## Testing

### Automated
- `axe-core` integration in Playwright e2e tests (smoke + targeted runs).
- `eslint-plugin-jsx-a11y` lint in CI.
- Lighthouse Accessibility audit in CI; failure threshold = warn at ≤95, block at ≤90.

### Manual
- VoiceOver pass on every Owner cockpit surface change.
- TalkBack pass on every mobile surface change.
- Keyboard-only pass on every web surface change.
- Screen magnifier pass quarterly.

### Real-user
- Recruit 2 design-partner staff who use accessibility features (low-vision, motor) as ongoing testers; honourarium per session.

## Voice + agent accessibility

Liv as voice receptionist serves accessibility implicitly. Beyond that:
- TTS voice cast for clarity (not just "personality"); per-locale review for intelligibility.
- Voice timeout generous (no interruption pressure for users with speech-pacing differences).
- Fallback to "press 1 to speak with a human" always available.
- DTMF (touch-tone) input as alternative to voice.

## When we get it wrong

Accessibility issues are SEV2 by default (not SEV3). They jump to SEV1 if the issue blocks a customer from booking entirely.

## Open questions

- Should the Owner cockpit aim for AAA in v1.5, or keep AA + AAA-for-customer-widget as the split?
- Voice receptionist intelligibility — should we publish a per-locale voice sample for users to verify before adopting? (Currently no; revisit per CS feedback.)
