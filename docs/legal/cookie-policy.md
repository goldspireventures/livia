# Cookie Policy (DRAFT — pre-counsel-review)

**Status:** Draft v1 (2026-05-07). NOT YET COUNSEL-REVIEWED.

## What this policy covers

Cookies + similar technologies (localStorage, sessionStorage) used on:
- `livia.io` (marketing site)
- `app.livia.io` (dashboard)
- `b.livia.io/<slug>` (public booking widget per shop)

## Quick read

- **Marketing site:** minimal first-party only. No third-party cookies. No tracking. Cookie banner appears for compliance, but our footprint is small.
- **Dashboard:** session cookie (you are signed in).
- **Public booking widget:** session storage only (your in-progress booking) — not tracked across sites.

## What we use

### `livia.io` (marketing site)

| Cookie / storage | Purpose | First-party? | Duration | Required? |
|---|---|---|---|---|
| Plausible Analytics anonymous counter | Anonymous visit counting (no PII; no cookies) | First-party | N/A (no cookies set) | No (anonymous) |
| Cookie-consent state | Remember your cookie banner choice | First-party | 12 months | Yes (functional) |
| Theme preference | Remember dark/light if we add a toggle | First-party | 12 months | No |

We don't use Google Analytics, Facebook Pixel, advertising cookies, or cross-site trackers.

### `app.livia.io` (dashboard)

| Cookie / storage | Purpose | First-party? | Duration | Required? |
|---|---|---|---|---|
| Clerk session cookie | Keep you signed in | First-party (Clerk on EU tenant) | 30 days | Yes |
| CSRF token | Security | First-party | Session | Yes |
| Current business id (localStorage) | Remember which business you last viewed | First-party | Persistent | No (defaults to most-recent) |
| Sentry error context | Attach minimal context to errors | First-party | Session | Yes (for support) |

### `b.livia.io/<slug>` (public booking widget)

| Cookie / storage | Purpose | First-party? | Duration | Required? |
|---|---|---|---|---|
| Booking session token | Track your in-progress booking | First-party (per shop) | Session (or 24h) | Yes |
| Locale preference | Remember language | First-party | 12 months | No |

We do NOT use analytics on the public booking widget. Per-shop traffic insights are aggregated server-side.

## What we don't use

- **Cross-site tracking cookies.**
- **Advertising cookies.**
- **Heatmap / session-replay tools** (e.g., Hotjar, FullStory).
- **Social-media pixels** (Facebook, LinkedIn, Twitter pixels).
- **Tag managers** (e.g., Google Tag Manager).
- **Third-party fonts** with cookie-loading (we self-host fonts).
- **Embedded third-party content** that drops cookies (no YouTube embeds without consent gating; no Twitter widgets).

## Your choices

- **Cookie banner** on first visit to `livia.io`: choose Accept / Reject. Reject still gives you a working site (we have no behavioural cookies to disable).
- **Browser controls:** modern browsers let you block cookies per site. We work fine with strict cookie blocking; some preferences won't persist.
- **Do Not Track:** we honour DNT signals.

## Per-market specifics

- **EU/IE/UK:** ePrivacy Directive + GDPR-compliant consent for non-essential cookies. Cookie banner + functional-only by default.
- **CCPA / California:** N/A at v1 (we don't operate in the US). At v2+ if relevant, separate notice.
- **Per-market additions** at v1.5+ (UK ICO requirements; Nordic specifics).

## Updates

- Material changes notified via banner.
- Changelog at `livia.io/legal/cookies/changelog`.

## Contact

privacy@livia.io for cookie + tracking questions.

---

**Drafting notes (delete pre-publication):**

- Counsel: please confirm we meet PECR (Privacy and Electronic Communications Regulations) standards for the UK + ePrivacy Directive standards for EU.
- Verify Plausible's "no cookies" claim — they use a daily-rotating fingerprint per domain; legitimate-interest basis under GDPR is widely accepted but counsel to confirm.
- Cookie consent banner UX should default to least-friction "Got it" with explicit "Reject all" CTA; counsel to confirm wording meets EDPB consent guidelines.
