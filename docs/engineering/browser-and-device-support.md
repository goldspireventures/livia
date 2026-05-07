# Browser and device support

**Status:** v1 (2026-05-07).

## Posture

Support what our users actually use. Don't waste engineering on long-tail. Be honest about what we don't support.

## Web browser support

### Owner cockpit + dashboard

| Browser | Min version | Notes |
|---|---|---|
| Chrome | last 2 major | Primary test target. |
| Edge | last 2 major | Behaves as Chrome. |
| Safari | last 2 major | Important for IE/UK Owner share. |
| Firefox | last 2 major | Test on each release. |

**No IE 11. No Opera Mini.**

### Customer booking widget (the public surface)

Wider compat — this is consumer-facing in salon back-rooms with whatever device.

| Browser | Min version | Notes |
|---|---|---|
| Chrome | last 4 major | |
| Safari | last 4 major | iOS Safari especially. |
| Edge | last 4 major | |
| Firefox | last 4 major | |
| Samsung Internet | last 2 major | Common on Android in EU. |
| Chrome on Android (mobile) | last 4 major | |
| Safari on iOS | last 4 major | |

Graceful degrade for older browsers: booking still works (server-rendered fallback), live chat downgrades to form.

### Marketing site (livia.io)

Same as customer booking widget. Static-rendered; works everywhere.

## Mobile platform support

### iOS

| Version | Status |
|---|---|
| iOS 17 | Primary target. |
| iOS 16 | Fully supported. |
| iOS 15 | Fully supported. |
| iOS 14 | Not supported (Expo SDK lower bound). |

Live Activities (ADR 0011 N3) require iOS 16.1+.
Dynamic Island require iPhone 14 Pro+.

### Android

| Version | Status |
|---|---|
| Android 14 | Primary target. |
| Android 13 | Fully supported. |
| Android 12 | Fully supported. |
| Android 11 | Fully supported. |
| Android 10 | Not supported. |

Widgets (ADR 0011 N4) supported across all supported versions.

### Tablet support

- iPad: usable at v1; adaptive layout (multi-staff calendar landscape) at v1.5/v2 per `mobile-roadmap.md` Phase D.
- Android tablets: usable at v1; adaptive layout at v2.

### Apple Watch / Wear OS

Post-v3 per `mobile-roadmap.md`.

## Network conditions

### Customer booking widget
- Designed for 3G+; tested on throttled "Slow 3G" profile (400ms RTT, 400Kbps).
- Initial paint <2s on 3G.
- Time-to-interactive <4s on 3G.
- Offline reads of last-fetched content (PWA-style).

### Owner cockpit
- Designed for broadband + 4G.
- Mobile cockpit (Expo) supports offline reads at v1.5 per ADR 0011 N5.

## Screen sizes

### Web
- Min: 320px width.
- Max: tested to 4K; layout caps at ~1440px content width.

### Mobile
- Min: iPhone SE 1 (320×568) — graceful but not primary target.
- Primary: iPhone 14/15 (390×844).
- Tablet: iPad mini (768×1024) and up.

## Input modalities

- Touch primary on mobile.
- Keyboard primary on web (mouse equivalent).
- Voice (via voice receptionist).
- DTMF (touch-tone fallback for voice).
- Apple Pencil / stylus on tablet (Body art portfolio annotation at v2).

## Languages + scripts

Per `docs/business/geographic-expansion.md`. v1: en-IE, en-UK. v2+ adds Latin-script European languages. CJK / RTL not on roadmap.

## Assistive tech

Per `docs/engineering/accessibility.md`:
- VoiceOver (iOS), TalkBack (Android), JAWS, NVDA, VoiceOver (macOS) — all tested.
- Screen magnifiers (Zoom, Magnifier).
- Keyboard-only.
- Switch-control (best-effort; quarterly check).

## What we don't support (and won't)

- IE 11 (no longer supported by Microsoft).
- Opera Mini (proxy-rendered; breaks SPAs).
- Lynx, w3m, text-only browsers (booking widget will degrade gracefully but not officially supported).
- iOS <14 / Android <11.
- Untrusted browsers (in-app browsers in random apps may break; we make best effort).

## Open questions

- Should we publish a "compatible browsers" page on `livia.io`? (Currently no — too tech-y for owners; revisit if CS sees confusion.)
- Apple Vision Pro / spatial computing — currently not on roadmap; revisit if a salon-relevant use case emerges.
