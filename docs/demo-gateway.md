# Demo gateway — persona launcher

**Status:** v1 implemented for local dev (2026-05-20). Production requires `LIVIA_DEMO_ENABLED=true`.
**Anchors:** ADR 0009, ADR 0010, ADR 0011, `docs/personas.md` (the hotel principle).

## Why this exists

Today, demoing Livia means signing in as a single OWNER on a single business and narrating "imagine if you were a stylist instead." That's the worst possible founder experience. It also does the product the deepest disservice — Livia's value is *that each persona has its own ritual* (the hotel principle in `docs/personas.md`), and you cannot prove that with one account.

The demo gateway is a one-tap persona launcher that drops a viewer into any of the seven personas against a fully-seeded demo business. It exists on both web and mobile so a founder can hand a phone to a salon owner across a coffee table and say "tap whichever role you want to see — this is Livia from inside their day."

## The seven demo doors

The launcher shows seven cards, one per persona from `docs/personas.md`. Each card is a complete *story*, not just a seed. The user taps and the app reloads as that persona, with the persona's first frame, ritual, and one canonical "wow" moment teed up.

| # | Persona | Demo identity | Tenant | Pre-seeded story |
|---|---|---|---|---|
| 1 | **Founder** (P1) | Aoife O'Connor (`demo-founder@livia.io`) | OWNER at *Aurora Studio*, *Aurora Mews*, *Aurora Galway* | Sunday evening. Three shops. Mews is up 18% week-on-week, Galway has 2 inbox messages waiting. Tenant switcher demonstrates immediately. |
| 2 | **Single-shop Owner** (P2) | Conor Walsh (`demo-owner@livia.io`) | OWNER at *Conor's Cut Co.* | Tuesday morning. €420 booked today across his two chairs. One DM Liv handled overnight is queued for review. |
| 3 | **Manager / ADMIN** (P3) | Niamh Doyle (`demo-admin@livia.io`) | ADMIN at *Aurora Studio* | Thursday 09:30. Three messages need her sign-off. Persona-switcher peek at Lara's day is one tap away — and the audit log entry is shown in real time to demonstrate transparency. |
| 4 | **Senior STAFF** (P4) | Lara Byrne (`demo-staff-senior@livia.io`) | STAFF at *Aurora Studio* | 10:55. Next client (Mary M., balayage) arrives in 5 minutes. Live-Activity-style countdown on the cockpit. Three booked + one chair waiting on a colour consultation. |
| 5 | **Junior STAFF** (P5) | Mo Healy (`demo-staff-junior@livia.io`) | STAFF at *Conor's Cut Co.* | 11:30. His day is open. The empty-state hero proves the "Your chair is open — here's how walk-ins work" ritual. |
| 6 | **Receptionist** (P6) | Síobhan Brady (`demo-frontdesk@livia.io`) | ADMIN at *Aurora Studio* (front-desk preset) | Saturday 14:00. Multi-staff calendar; phone is ringing (incoming Liv conversation); two walk-ins to route. |
| 7 | **End Customer** (P7) | Mary McNamara (no Clerk account) | n/a — opens `livia.io/b/aurora-studio` | She opens the public booking page on her phone, books a slot, talks to Liv over chat. Demo the customer side as a bare browser tab, not signed in. |

## The five-frame ritual (every demo persona)

Every demo persona must deliver, in order, five frames within the first 30 seconds of being entered:

1. **Welcome line** — copy that names the persona ("Good morning, Lara"; "Sunday evening, Aoife — three shops, all green").
2. **Their ritual surface** — My Day for STAFF, Today for OWNER, multi-staff calendar for Receptionist, the public booking page for Customer.
3. **One incoming alert** — a message Liv handled, a customer waiting, a refund to approve. Always seeded so the demo never opens to silence.
4. **One memorable native moment** — Live Activity countdown for Lara; the cross-business glance for Aoife; the audit-log popover for Niamh; the walk-in hero for Mo. (See `docs/mobile-roadmap.md` "wow moments" — they double as demo cues.)
5. **One escape hatch** — a "Switch persona" button persistent in the corner, so the viewer can hop without re-launching.

This is the hotel principle made operational: the experience is built top-down per persona, not as a degraded clone.

## How it works

### Surface

- **Web:** route at `/demo`. Card grid, dark Aurora Midnight surface, champagne accent on the active card. Tap → set Clerk session via Clerk's "sign in as user" magic-link flow → land on the persona's first frame.
- **Mobile:** a Demo entry in the More tab (only visible for demo Clerk users; see safety rails). Same card grid, full-bleed bottom sheet. Tap → set the active session → land on the persona's tab.
- **Persistent persona switcher** appears as a small chip in the top-right of every screen while in demo mode, so the viewer can hop in one tap without going back to `/demo`.

### Auth + session

We do **not** keep seven separate Clerk sessions cached. Each demo user is a real Clerk user pre-provisioned in our staging Clerk instance with a stable email pattern (`demo-<persona>@livia.io`) and a fixed password held in a server-side secret. The launcher calls a server endpoint `POST /api/demo/sign-in` with `{ persona: "staff-senior" }`; the server signs the viewer into the matching Clerk identity using Clerk's backend SDK and returns a session token to the client.

### Seed data

A `lib/db` seed script (`pnpm db:seed:demo`) materialises:

- 3 demo businesses (Aurora Studio, Aurora Mews, Aurora Galway), 1 demo single-shop business (Conor's Cut Co.), and the membership rows for every demo persona.
- 14 demo staff with believable bios + photos + service lists.
- 200 demo customers per business with realistic Irish names + booking history spanning 90 days backwards and 14 days forwards.
- 25 demo conversations (mix of SMS, IG, email) with Liv replies threaded.
- 1 audit-log entry per persona to demonstrate the transparency feature.

The seed is idempotent: re-running resets every demo business to the same baseline. A nightly cron in production resets demo state at 03:00 EU/IRE.

## Safety rails (non-negotiable)

The demo gateway is a privileged surface. Three independent gates:

1. **Environment flag.** `LIVIA_DEMO_ENABLED=true` must be set in the environment. Production is `false` by default. The endpoint returns `404` (not `403`) when the flag is off so we never leak its existence.
2. **Clerk identity allow-list.** Even with the flag on, only Clerk users whose email matches `^demo-` or ends in `@livia.io` can call the endpoint. Other users see `404`.
3. **Audit log.** Every demo-mode entry writes a row to `audit_log` with `route: "/api/demo/sign-in"`, `actorUserId: <viewer's Clerk id>`, `targetPersona: <which door>`. Retention is the same 90-day window as impersonation audits.

A founder demoing on a real device must sign in as a `@livia.io` user first; ordinary customers can never see the launcher.

## What the demo gateway is **not**

- Not a sandbox for customers to "try Livia." Free trials are a separate Stripe-gated flow (Lane 4 L7). A salon owner who taps "Get started" on `livia.io` does **not** land in the demo — she lands in real onboarding.
- Not a way to bypass authorisation. The persona is enforced at the data layer (`requireRole`); the demo just hands you a real Clerk identity that already holds the right membership.
- Not a place to test new features. We test on real environments. The demo is locked to the v1 product surface.
- Not a permanent product surface. Once the design-partner motion is fully self-service (post-Gate-3), the gateway is feature-flagged off in production by default and used internally only.

## Implementation status

- [x] `audit_log` table — shared dependency with impersonation policy.
- [x] `POST /api/demo/provision` — Aurora world + Clerk users (`demo-portal.service.ts`).
- [x] `POST /api/demo/sign-in` — Clerk ticket + safety rails (dev open; prod gated).
- [x] `/demo` live launcher on web — one-tap persona sign-in.
- [x] Persistent **Switch persona** chip on authenticated shell.
- [x] `docs/testing/FULL-LIVIA-EXPERIENCE.md` — personal E2E playbook.
- [ ] Nightly cron to reset demo state in production — follow-on.
- [ ] Full gateway seed density (200 customers / 25 conversations per shop) — follow-on.

These are all proposed at the end of Task #59. The gateway must not ship until **all three** safety rails are independently tested.

## EU/IRE residency

Demo personas, demo businesses, demo customers, demo conversations all live in the same EU/IRE Postgres as real tenant data, behind the same row-level isolation. Demo data is real data — it just resets nightly.

## Channel stack (WhatsApp / Instagram / SMS)

After `pnpm demo:provision`, flagship shops (e.g. **aurora-studio**, **conors-cut-co**, market capitals) get production-like comms config:

| Surface | What you see |
|---------|----------------|
| **Settings → Communications** | WhatsApp Phone number ID, Instagram Page ID, demo SMS number, Meta webhook URL |
| **Inbox** | WhatsApp, Instagram DM, Messenger threads with Liv replies (not SMS-only) |
| **`GET /api/demo/status`** | `channels.ready: true`, thread counts |

Stable demo Meta IDs (e.g. `demo_wa_aurora_studio`) so `META_DEV_SIMULATE=true` + **Simulate inbound** resolves the right tenant.

**Try it:** Sign in as founder → Aurora Studio → Inbox (Emma Walsh on WhatsApp) → Settings → Communications (channels show as configured).
