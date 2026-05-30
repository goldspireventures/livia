# Livia — Post-Demo Launch Plan

> **Production domains:** `livia-hq.com`, `app.`, `api.` — see [`PLATFORM-TERMINOLOGY.md`](./PLATFORM-TERMINOLOGY.md). Historical references to `livia.io` in this doc are being migrated; treat `livia-hq.com` as canonical for new work.

**Owner:** founder
**Status:** v1 — locked at end of Demo Readiness (Task #23)
**Cadence:** revisited every Monday (see `docs/operating-cadence.md`)
**Last reviewed:** 2026-05-06 — founder (v1 lock)

This is the single authoritative document that sequences Livia from "we can demo this" to "real shops are paying us in production." It supersedes earlier pre-Livia plans, which were removed during the May 6 cleanup pass.

**Strategy anchors (added 2026-05-06, Task #59):** the multi-tenant + persona model is locked in [ADR 0010](./adr/0010-multi-tenant-and-persona-model.md). Mobile is the flagship surface per [ADR 0011](./adr/0011-mobile-flagship.md). The personas this product serves are catalogued in [`docs/personas.md`](./personas.md) (read the *hotel principle* section first — it's the experience tenet every persona is judged against). Policy back-stop in [`docs/policy/`](./policy/). Mobile execution sequence in [`docs/mobile-roadmap.md`](./mobile-roadmap.md). Per-persona demo experience spec in [`docs/demo-gateway.md`](./demo-gateway.md).

The plan is organised as **five lanes** running in parallel, gated by **three release gates**. Each gate has explicit, non-negotiable acceptance criteria. No gate is "passed" by feel — only by criteria check.

**Founder “done” (2026-05):** **Platform-Ready** = product/engineering/design can serve the wedge without embarrassing gaps — see [`docs/product/LIVIA-IDEA-TO-REALITY.md` Part V](./product/LIVIA-IDEA-TO-REALITY.md). **Acceptable delays after that** = Lane 4 **Launch ops** + Lane 3 **Compliance** sign-off (Stripe Dashboard, store listings, counsel, DNS) — not another core CRUD sprint. Gates 2/3 below still apply for *public* launch; they mix platform criteria with ops criteria — use Part V to separate what blocks *serving* vs what blocks *charging in prod*.

---

**EU product truth & build sequence:** [`docs/product/LIVIA-COMPLETE-SYSTEM-SPEC.md`](product/LIVIA-COMPLETE-SYSTEM-SPEC.md) · [`docs/product/LIVIA-FINAL-EXECUTION-PLAN.md`](product/LIVIA-FINAL-EXECUTION-PLAN.md)

---

## The five lanes

1. **Engineering** — code quality, repo hardening, observability, perf, security, ADRs, CI/CD, design-system extraction, post-merge ops.
2. **Brand** — `livia.io` marketing site, brand voice doc, social presence, logo / wordmark / asset library, status page, changelog page.
3. **Compliance** — EU AI Act Art. 50 disclosure surfaces, GDPR (DPA, data-export, data-delete, retention policy), Anthropic AUP copy, ToS + Privacy, cookie banner, security.txt, SOC 2 readiness checklist.
4. **Launch ops** — TestFlight build pipeline, Play Store internal testing, Resend transactional email, Twilio number provisioning, Stripe account + Connect for shops, Sentry, Statuspage, Plausible / PostHog analytics.
5. **GTM** — design-partner pipeline (10 hand-recruited Dublin shops), founder-narrated onboarding looms, weekly "Liv made you €X" digest emails, Product Hunt launch kit, EU founder-led outreach scripts.

---

## The three gates

### Gate 1 — Demo Day (locked May 5)

Already locked by Task #23 (Livia demo readiness). Acceptance:

- Every flow vetted end-to-end.
- Design system clean (token sweep complete; no rogue Tailwind colour utilities on dashboard pages).
- Playwright green on the smoke suite.
- Architect PASS on the demo build.
- `docs/demo-script.md` exists, founder can narrate it in 90s.

### Gate 2 — Closed Beta (TestFlight + 10 design partners)

Acceptance — **all must hold for 7 consecutive days before declaring Gate 2 passed:**

- `docs/audits/marketing-vs-reality.md` has zero rows in state `build-before-G2`. (Promise integrity — see Task #49.)

- TestFlight build accepted by Apple; internal testers can install.
- Play Store internal testing track live; internal testers can install.
- Resend transactional emails actually sending (booking confirm, reminder, cancel) with verified `livia.io` sender domain.
- Twilio number provisioned per shop; Liv answers an inbound SMS in <10s with a plausible reply.
- Sentry connected; zero P0s in the rolling 7-day window.
- 10 shops onboarded with at least one **real** customer booking each (not seeded demo data).
- Founder NPS conversation completed with each design partner; transcripts in `.local/research/design-partners/`.

### Gate 3 — Public Launch

Acceptance:

- `docs/audits/marketing-vs-reality.md` has zero rows in state `build-before-G3`. (Promise integrity — see Task #49.)

- Stripe Billing live with €49 / €99 / €149 tiers; first paid subscriber active.
- Stripe Connect live for shop deposits + tips; one shop has taken a real deposit and a real tip.
- App Store + Play Store live (not just internal); first organic download recorded.
- `livia.io` marketing site live with hero, pricing, signup CTA, status link, changelog link.
- Status page live (Statuspage or Better Stack) with components for API / Web / Mobile / Liv-AI.
- `livia.io/changelog` live, populated from the in-product release notes feed.
- ToS + Privacy + DPA published at `livia.io/legal/{tos,privacy,dpa}`; reviewed by counsel.
- SOC 2 Type 1 audit kicked off (engagement letter signed, scoping call done).
- First €1k MRR in pipeline (sum of MRR from active subs + signed-but-pending shops).

---

## Per-lane backlog

Sizing: **S** ≤ one focused day · **M** 2-5 days · **L** > 1 week. Target gate is the gate the item must land **before**.

### Lane 1 — Engineering

| # | Item | Size | Gate |
|---|---|---|---|
| E1 | Playwright smoke suite expanded to cover sign-in, public booking + chat, owner inbox take-over, settings AI tab. CI runs on every PR. | M | 2 |
| E2 | Sentry wired in api-server + dashboard + mobile, with `release` tagging from build hash. | S | 2 |
| E3 | Structured request logging in api-server (pino + request id + tenant id + user id). | S | 2 |
| E4 | OpenAPI contract test in CI: `pnpm codegen` must produce no diff. | S | 2 |
| E5 | Drizzle migration history committed to repo + production migrate-on-deploy hook. | M | 2 |
| E6 | `bookings.sourceConversationId` schema column + OpenAPI ripple — unblocks "Liv made you €X today". | M | 2 |
| E7 | Extract design tokens (`aurora-*`, `aurum-*`, type, radius, motion) into a shared `lib/design-system` package consumed by web + mobile. | L | 3 |
| E8 | ADR doc set: `/docs/adr/0001-aurora-aurum-split.md`, `0002-clerk-auth.md`, `0003-anthropic-via-replit-integrations.md`, `0004-pnpm-monorepo-routing.md`. | M | 2 |
| E9 | Lighthouse 90+ audit on dashboard + public booking; fix regressions. | M | 3 |
| E10 | Per-tenant rate limit on `/api/public/b/:slug/chat` (10 req / 60s / IP+slug). | S | 2 |
| E11 | Background job runner (BullMQ or Postgres-backed) for reminders + digest emails. | M | 3 |
| E12 | Replace dashboard cockpit `enrichBooking` N+1 with batched query. | S | 3 |

### Lane 2 — Brand

| # | Item | Size | Gate |
|---|---|---|---|
| B1 | `livia.io` marketing site v1 — hero, three pillars, pricing, FAQ, signup CTA. Vite static build, EU CDN/hosting. | L | 3 |
| B2 | Brand voice doc — `docs/brand/voice.md` — tone rules, do / don't lexicon, sample copy for empty states + success toasts + AI moments. | M | 2 |
| B3 | Logo + wordmark asset library (`docs/brand/assets/`): SVG + PNG @1x/2x/3x for mark, wordmark, app icon, favicon, social cards. | M | 2 |
| B4 | Open Graph image generator for public booking pages (per-shop `og:image`). | M | 3 |
| B5 | `livia.io/changelog` page reading from `docs/changelog.md`. | S | 3 |
| B6 | Status page (Statuspage / Better Stack) at `status.livia.io`. | S | 3 |
| B7 | Social presence seeded: X/@liviaio, LinkedIn page, Instagram (handle parked at minimum). | S | 3 |
| B8 | Press kit at `livia.io/press` — one-pager, founder photo, screenshots, logo zip. | S | 3 |
| B9 | First eight founder posts written + scheduled (Linear or a Notion calendar). | M | 3 |
| B10 | ✅ Brand audit complete (Task #38, May 6 2026): full repo rename to **Livia**. Final product-code cleanup May 2026 — no legacy codename strings outside historical docs. | M | 2 |

### Lane 3 — Compliance

| # | Item | Size | Gate |
|---|---|---|---|
| C1 | EU AI Act Art. 50 disclosure on the public chat widget — first message + persistent footer. | S | 2 |
| C2 | EU AI Act Art. 50 disclosure on outbound SMS / email when authored by Liv. | S | 2 |
| C3 | GDPR data-export endpoint per business owner (`POST /api/me/export`) — JSON + CSV bundle delivered by email. | M | 3 |
| C4 | GDPR data-delete endpoint — soft-delete + 30-day purge job. | M | 3 |
| C5 | Retention policy doc + automatic purge of raw conversation transcripts > 90 days unless flagged. | M | 3 |
| C6 | DPA template at `livia.io/legal/dpa` — vetted by counsel, signable per shop. | M | 3 |
| C7 | ToS + Privacy at `livia.io/legal/{tos,privacy}` — counsel-reviewed. | M | 3 |
| C8 | Cookie banner on `livia.io` and dashboard (not on public booking — first-party only there). | S | 3 |
| C9 | `security.txt` published at `/.well-known/security.txt` on every public domain. | S | 2 |
| C10 | Anthropic AUP compliance copy — small footer on the public booking chat ("Powered by Anthropic Claude"). | S | 2 |
| C11 | SOC 2 Type 1 readiness checklist drafted; vendor selected (Vanta / Drata / Secureframe). | M | 3 |
| C12 | "Olivia" naming taboo enforced via repo-wide grep in CI; build fails if introduced. | S | 2 |

### Lane 4 — Launch ops

| # | Item | Size | Gate |
|---|---|---|---|
| L1 | TestFlight pipeline — Expo EAS build → upload → internal group invited. | M | 2 |
| L2 | Play Store internal testing — Expo EAS build → upload → internal track. | M | 2 |
| L3 | Resend account provisioned, `livia.io` sender domain DNS verified, transactional templates wired. | M | 2 |
| L4 | Twilio account provisioned, A2P 10DLC registration started for IE / UK numbers. | M | 2 |
| L5 | Per-shop Twilio number provisioning flow (Settings → Communications → "Get a number"). | M | 2 |
| L6 | Stripe account live (production keys), Stripe Connect onboarding link in Settings → Payments. | M | 3 |
| L7 | Stripe Billing — products + prices for €49 / €99 / €149 tiers; checkout link in Settings → Plan. | M | 3 |
| L8 | Sentry projects (api / web / mobile), source maps uploaded on build. | S | 2 |
| L9 | Statuspage / Better Stack components + automated incident creation from Sentry P0s. | S | 3 |
| L10 | Plausible (privacy-first) analytics on `livia.io` + dashboard; PostHog optional for funnel work. | S | 3 |
| L11 | Production deploy pipeline — `pnpm build` → EU hosting (API + static) → smoke test ping. | M | 2 |
| L12 | DNS for `livia.io`, `app.livia.io`, `status.livia.io`, `b.livia.io` (public booking hostname). | S | 2 |

### Lane 5 — GTM

| # | Item | Size | Gate |
|---|---|---|---|
| G1 | Design-partner shortlist — 25 Dublin shops, hand-picked across barber / nails / lashes / tattoo / dental. → `.local/research/design-partners/shortlist.md` + tracker at `.local/research/design-partners/tracker.md`. *(Both intentionally under `.local/` — research notes follow the same gitignored-by-design convention as design-partner call notes in `docs/operating-cadence.md`.)* | S | 2 |
| G2 | Outreach script v1 — DM (3 vertical variants) + walk-in + intro email + follow-up + warm-intro. Founder-led, no SDR voice. → `docs/gtm/outreach-scripts.md`. | S | 2 |
| G3 | Onboarding loom #1 — "Get Liv answering your DMs in 5 minutes." Timed beat script. → `docs/gtm/loom-onboarding-1.md`. Recording is a separate founder action. | S | 2 |
| G4 | Onboarding loom #2 — "Wire up your Stripe to take deposits." | S | 3 |
| G5 | Onboarding loom #3 — "Your first weekly digest." | S | 3 |
| G6 | Weekly "Liv made you €X this week" digest email — generated from `bookings.sourceConversationId` (depends on E6). | M | 3 |
| G7 | Product Hunt launch kit — gallery, gif, headline, first-comment script, hunter lined up. | M | 3 |
| G8 | Founder personal-brand cadence — 3 posts/week (X + LinkedIn) for the 8 weeks pre-launch. | S | 3 |
| G9 | "What competitors miss" comparison page (`livia.io/vs`) — Fresha, Booksy, Square Appointments. | M | 3 |
| G10 | First case-study draft — one design partner, written by founder after first paying month. | M | 3 |

---

## How this document is used

- **Founder reads top-to-bottom every Monday morning.** Updates statuses, removes done items, adds discovered work.
- **Tracker mirrors only the next 2-3 items per lane.** When a tracker task lands, the next item from this doc gets promoted.
- **Gate criteria are the only "definition of done" that matters.** No item ships independently of its gate; gates ship as a unit.
- **Anything not in this document is not on the roadmap.** Drift requests get added here first, then to the tracker.

---

## Salvaged from the legacy roadmap

The stale `.local/tasks/RELEASE-PLAN.md` and the 12 legacy `01-…17-` task files were audited and folded into the lanes above. Specifically:

- `01-brand-story-first-impression` → Brand B1, B2, B3.
- `02-personas-roles-action-dashboard` → covered by the Cockpit dashboard, the OWNER/ADMIN/STAFF split (Task #48, ADR 0009), the multi-tenant + persona model (Task #59, ADR 0010), and the per-persona experience tenet in `docs/personas.md`. The mobile roadmap to flagship (`docs/mobile-roadmap.md`) lands in phased build tasks across Gate 2 + 3. Further role expansion (FRONT_DESK as a real role, ORG_OWNER) and consolidated org-level billing remain deferred until post-Gate-3.
- `03-ai-inbound-and-notifications` → Lane 4 (L3, L4, L5); the AI inbox itself shipped May 5.
- `04-revenue-protection-deposits-tips` → Launch ops L6, L7 (infra) + a separate post-Gate-3 product task.
- `05-walkins-recurring-import-whitelabel` → out of v1 launch scope; revisit post-Gate-3.
- `06-premium-ops-loyalty-retail-portfolio` → out of v1 launch scope; revisit post-Gate-3.
- `07-marketing-growth-engine` → partially mapped to GTM G6 (digest); rest is post-Gate-3.
- `08-multilocation-reporting-ai-insights` → post-Gate-3.
- `09-consumer-marketplace-flywheel` → post-Gate-3 (only meaningful at scale).
- `10-platform-integrations-api` → post-Gate-3.
- `11-advanced-ai-moat` → post-Gate-3.
- `12-trust-compliance-platform-quality` → split across Compliance lane and Engineering E2/E3/E5/E10.
- `13-design-system-brand-visual-identity` → Engineering E7 + Brand B3.
- `14-surface-architecture-and-journeys` → already executed by demo-readiness + Cockpit + mobile premium polish.
- `15-settings-ai-training-policies` → already executed by AI-inbox wave.
- `16-pricing-packaging-billing-monetisation` → Launch ops L7.
- `17-lifecycle-fraud-support-customer-success` → split across Compliance C3/C4/C5 and post-Gate-3 work.

The 12 legacy tracker tasks (PROPOSED state, refs #6–#17) are being **CANCELLED — superseded by `docs/launch-plan.md` v1**. Their plan files remain in `.local/tasks/` for archive purposes; they are no longer part of the live roadmap.
