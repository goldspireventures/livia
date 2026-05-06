# Onboarding — first engineer / designer

Welcome. This is the only doc you have to read before your first PR. Everything else is linked from here.

## What Livia is

Livia is a premium AI-native operating system for appointment-based service businesses — barbershops, tattoo studios, dental practices, nail salons. Beachhead market: EU, starting Dublin. The product is **Livia**; the AI character that does the work under the hood is called **Liv**. We never market "Liv" as the product, and we never market Livia as "AI software" — the AI shows up only where it has to (legally) and where it actually helps the customer.

## What's shipped

- Multi-tenant API (Node 24 + Express 5 + Postgres + Drizzle), with Clerk auth and conflict-safe booking creation under advisory locks.
- Web dashboard (React + Vite) — the **Cockpit** layout shipped May 5, with a live timeline spine, action queue, and staff-on-shift card.
- Mobile app (Expo, iOS + Android) — premium polish pass complete: Aurora ambient backdrop, gradient CTAs, haptics, custom sign-in.
- Public booking page at `/b/:slug` with chat widget powered by Liv (Anthropic Claude tool-loop, `find_slots` + `create_booking`).
- AI Inbox — owners watch Liv's conversations live, can take over, and configure tone / greeting / knowledge / auto-book in Settings → AI Assistant.
- Demo-ready surface — token sweep complete, wow-moment champagne shimmer + welcome aurora sweep, demo script in `docs/demo-script.md`.

## What's next

`docs/launch-plan.md` — the single source of truth. Five lanes (Engineering / Brand / Compliance / Launch ops / GTM), three gates (Demo Day ✅ / Closed Beta / Public Launch). Everything else is downstream of that doc.

## Where to start reading

In this order:

1. `replit.md` — repo conventions, brand layers (Aurora vs Aurum), gotchas, AI character.
2. `docs/launch-plan.md` — what we're shipping and why.
3. `docs/operating-cadence.md` — how we run the week.
4. `docs/demo-script.md` — what the product *should feel like* when it works.
5. `docs/adr/` — architecture decision records (Aurora/Aurum split, Clerk auth, Anthropic via Replit Integrations, pnpm monorepo routing). Read these before you suggest changing anything load-bearing.
6. `lib/db/src/schema/` — single source of truth for the data model. Conversations live in `conversations.ts`; the 5 AI columns on `businesses` are the contract for Liv's behaviour.
7. `lib/api-spec/openapi.yaml` — single source of truth for HTTP. `pnpm --filter @workspace/api-spec run codegen` regenerates hooks + Zod schemas. The CI guard is in lane Engineering E4.

## How to run the repo

```bash
pnpm install
pnpm run typecheck                # full graph
pnpm --filter @workspace/db run push                # dev DB schema
pnpm --filter @workspace/api-server run dev          # API
# Web + Mobile artifacts auto-start via the workflow runner.
```

Required env vars are listed in `replit.md` → "Run & Operate". Anthropic credentials come via Replit AI Integrations — there is no `ANTHROPIC_API_KEY` to set.

## Brand rules — non-negotiable

- **Aurora** = product surface. Cyan (`#06b6d4`) is the only primary action colour. Violet for AI moments, mint for success.
- **Aurum** = wordmark only — champagne / cream / bronze chrome. **Never** Aurum on action buttons. The single sanctioned exception is `.celebrate-shimmer` (one-shot champagne sweep on booking confirmation).
- **Wordmark** = Cormorant Garamond, italic *v*. Lock-up is on canvas at `livia-wm-aurum`.
- **Voice** = precise, calm, slightly poetic. Empty states whisper. AI suggestions invite, never pressure.
- Tagline: *For barbershops, tattoo studios, dental practices — and every appointment in between.*

## AI guardrails

- Liv is the AI character. The product is Livia. Never collapse the two in customer-facing copy.
- Brand layer is silent on "AI" — no "AI-powered" badges in marketing.
- Disclosure shows up where it legally must: chat widget first message (EU AI Act Art. 50), Privacy + ToS (GDPR Art. 22), Anthropic AUP footer on the public booking page.
- Liv's behaviour is configured per-business via the 5 AI columns on `businesses` — no global hardcoded persona.

## EU compliance posture

- We assume EU AI Act + GDPR apply from day one. We are a deployer of an AI system; disclosures are mandatory; data-export and data-delete must work end-to-end before Gate 3.
- We are an Anthropic processor — their AUP applies downstream.
- Compliance lane in `docs/launch-plan.md` (C1–C12) is the working list. Don't ship a feature that adds a new disclosure surface without ticking the matching C-item.

## Things to never do

- **Never reintroduce the name "Bliq" in user-facing copy.** Internal slugs (`bliq-mobile`, `bliq-dashboard`, `STORAGE_KEY = "bliq_current_business_id"`, scheme `bliq-mobile`) are deliberately preserved — changing them breaks Clerk redirect URIs, Google OAuth callbacks, and on-device storage. See `replit.md` → "Where things live" + "Gotchas".
- **Never use the name "Olivia" anywhere** — in code, comments, copy, file names, UI strings, or commit messages. It's the founder's daughter's name and is privately reserved. There is a CI guard in lane Compliance C12 that fails the build if it appears.
- **Never use Aurum for an action button.** Cyan stays the action colour. The only exception is the celebrate shimmer.
- **Never edit `lib/db/src/schema/*` without a migration**, and never edit `lib/api-spec/openapi.yaml` without re-running `pnpm codegen`.
- **Never deploy on a Friday after 16:00 IST** unless it's a P0 hotfix (see `docs/operating-cadence.md`).

## When you're stuck

Ping the founder. We're small enough that there's no escalation ladder — direct is correct.
