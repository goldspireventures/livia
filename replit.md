# Livia

Premium AI-native multi-tenant OS for appointment-based service businesses (beauty/wellness/barber/tattoo/dental). Beachhead: EU/Ireland. AI character is **Liv**.

## Run & Operate

- `pnpm run typecheck` · `pnpm run build` · `pnpm --filter @workspace/api-spec run codegen` · `pnpm --filter @workspace/db run push`
- **Required env:** `CLERK_*` (api/web/mobile variants), `DATABASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_*`.
- **Optional:** `SENTRY_DSN_*`, `LOG_LEVEL`, `TWILIO_*`, `RESEND_*`, `PUBLIC_BASE_URL`, `INTERNAL_CRON_SECRET`. Transports degrade to PENDING-only writes when secrets are absent — no boot failure. Full list: `docs/onboarding-engineer.md`.

## Stack

pnpm workspace · TS 5.9 · Node 24 · Express 5 · PostgreSQL + Drizzle · Zod (`zod/v4`) + `drizzle-zod` · Orval codegen · Vite (web) · Expo (mobile) · Clerk · Anthropic Claude.

## Where things live

- `artifacts/{api-server,livia-dashboard,livia-mobile,livia-marketing,mockup-sandbox}` — see each `package.json`.
- `lib/db` — Drizzle schema (source of truth: `lib/db/src/schema/*`).
- `lib/api-spec` — OpenAPI source. Codegen → `lib/api-zod` + `lib/api-client-react`.
- `lib/integrations/{anthropic-ai,resend,twilio}` — third-party SDK wrappers.
- `lib/ai-disclosure` — centralised legal disclosure copy (EU AI Act Art. 50).

## Architecture decisions

- **Booking creation is conflict-safe:** Drizzle tx + `pg_advisory_xact_lock` keyed by `businessId:staffId`.
- **Slot generation is timezone-aware** via `artifacts/api-server/src/lib/tz.ts` — day boundaries use business tz, not server's.
- **AI chat:** Claude tool-loop (`claude-sonnet-4-6`, `MAX_TOOL_HOPS=6`); tools `find_slots` + `create_booking`; gated by `business.aiEnabled`.
- **Disclosure** is applied in `services/ai-outbound.service.ts` before persistence — cannot be bypassed by transport choice.
- **API conventions:** Staff/Customer use `displayName`; Service uses `priceMinor`; Booking uses `startAt`/`endAt`; list responses use `.data[]`. Generated hooks expose options via `{ query: UseQueryOptions<...> }`. Mobile mutations use a `data` key.

## Brand

**Aurora (product surface)** — cinematic midnight base + violet→cyan→mint gradient. Cyan `#06b6d4` = primary action; violet `#8b5cf6` = automated/Liv; mint `#10b981` = success. Tokens: `livia-dashboard/src/index.css` (`--color-aurora-*`) + `livia-mobile/constants/colors.ts`.

**Aurum (wordmark accent)** — champagne/cream/bronze chrome **reserved for the Livia wordmark + italic *v* only**. Never on action buttons or section headings.

**Type:** Display = Plus Jakarta Sans · Body = Geist · Data = JetBrains Mono · Wordmark = Cormorant Garamond. Radius `0.75rem`.

**Voice:** precise, calm, slightly poetic. **Tagline:** *For barbershops, tattoo studios, dental practices — and every appointment in between.*

## Product

Dashboard (Cockpit, bookings, customers, services, staff, availability, time-off, AI Inbox, settings, public booking `/b/:slug`); Mobile (Expo, custom Clerk sign-in with Google OAuth via `livia-mobile://oauth-callback`); Marketing (`livia.io` v1). AI Inbox: customer chats → Liv books → owner sees thread, can take over. Per-shop comms (Twilio/Resend) wired in `services/booking-emails.service.ts` + `routes/communications.ts`.

## Compliance

EU AI Act Art. 50 disclosure on chat widget, outbound SMS/email, public booking page. GDPR Art. 22 in privacy/terms. Disclosure copy lives only in `@workspace/ai-disclosure`. **Never surface "Olivia" anywhere.**

## Gotchas

- Always `pnpm run typecheck` before declaring done.
- Aurum is brand-only; cyan is the action colour.
- React Native Web `shadow*` / `pointerEvents` deprecation warnings are expected.

## Pointers

- Roadmap: `docs/launch-plan.md` · Cadence: `docs/operating-cadence.md` · Onboarding: `docs/onboarding-engineer.md` · Demo: `docs/demo-script.md`.
- Skills: `pnpm-workspace`, `clerk-auth`, `database`, `deployment`, `artifacts`, `react-vite`, `expo`, `canvas`, `mockup-sandbox`.
