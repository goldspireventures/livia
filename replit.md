# Livia — engineering notes

> **Prefer:** [`README.md`](./README.md) and [`docs/LOCAL_DEV.md`](./docs/LOCAL_DEV.md) for how to run the stack. This file is legacy shorthand; kept for bookmarked links.

Premium multi-tenant OS for appointment-based service businesses. Beachhead: EU/Ireland. AI colleague is **Liv**.

**Onboarding:** [`docs/onboarding-engineer.md`](./docs/onboarding-engineer.md) · **ADRs:** [`docs/adr/`](./docs/adr/)

## Run & Operate

- `pnpm run typecheck` · `pnpm run build` · `pnpm --filter @workspace/api-spec run codegen` · `pnpm --filter @workspace/db run push`
- **Required env:** `CLERK_*`, `DATABASE_URL`. **Liv AI:** `ANTHROPIC_API_KEY` (optional in dev).
- **Optional:** `SENTRY_DSN_*`, `LOG_LEVEL`, `TWILIO_*`, `RESEND_*`, `PUBLIC_BASE_URL`, `INTERNAL_CRON_SECRET`. Transports degrade to PENDING-only writes when secrets are absent — no boot failure.

## Stack

pnpm workspace · TS 5.9 · Node 24 · Express 5 · PostgreSQL + Drizzle · Zod (`zod/v4`) + `drizzle-zod` · Orval codegen · Vite (web) · Expo (mobile) · Clerk · Anthropic Claude.

## Where things live

- `artifacts/{api-server,livia-dashboard,livia-mobile,livia-marketing,mockup-sandbox}` — see each `package.json`.
- `lib/db` — Drizzle schema (source of truth: `lib/db/src/schema/*`).
- `lib/api-spec` — OpenAPI source. Codegen → `lib/api-zod` + `lib/api-client-react`.
- `lib/integrations/{anthropic-ai,resend,twilio}` — third-party SDK wrappers.
- `lib/ai-disclosure` — centralised legal disclosure copy (EU AI Act Art. 50).

## Operational notes (decisions live in ADRs)

- **Booking creation is conflict-safe:** Drizzle tx + `pg_advisory_xact_lock` keyed by `businessId:staffId`.
- **Slot generation is timezone-aware** via `artifacts/api-server/src/lib/tz.ts` — day boundaries use business tz, not server's.
- **AI chat:** Claude tool-loop (`claude-sonnet-4-6`, `MAX_TOOL_HOPS=6`); tools `find_slots` + `create_booking`; gated by `business.aiEnabled`.
- **Disclosure** is applied in `services/ai-outbound.service.ts` before persistence — cannot be bypassed by transport choice.
- **API conventions:** Staff/Customer use `displayName`; Service uses `priceMinor`; Booking uses `startAt`/`endAt`; list responses use `.data[]`. Generated hooks expose options via `{ query: UseQueryOptions<...> }`. Mobile mutations use a `data` key.

## Brand (one-liner — full discipline in ADR 0007)

Aurora cyan `#06b6d4` = primary action; violet `#8b5cf6` = Liv/AI moments; mint `#10b981` = success. Aurum (champagne) = wordmark only, **never on action buttons**. Type: Display = Plus Jakarta Sans · Body = Geist · Wordmark = Cormorant Garamond. `livia.io` is the brand bible (ADR 0004).

## Gotchas

- Always `pnpm run typecheck` before declaring done.
- Aurum is brand-only; cyan is the action colour.
- Never reintroduce the legacy codename or use "Olivia" — both are CI-guarded.
- React Native Web `shadow*` / `pointerEvents` deprecation warnings are expected.

## Demo gateway (the "hotel principle")

- Public route `/demo` (dashboard + mobile, mounted **outside** AuthGuard) — 7 hand-crafted persona surfaces (founder · owner · manager · staff-senior · staff-junior · receptionist · customer), all mock data, no API calls. Registry: `artifacts/livia-dashboard/src/lib/demo/personas.ts`. Mobile `BusinessProvider` short-circuits `useGetMyBusinesses` when `useSegments()[0] === "demo"`.
- Multi-business switcher persists `livia.currentBusinessId` (web + mobile, same key — ADR 0010). Mobile migrates from legacy `livia_current_business_id`.
- Mobile `useColors()` is hard-coded to dark; Aurora-Midnight is the only sanctioned palette across web + mobile + marketing.

## Pointers

- Roadmap: `docs/launch-plan.md` · Cadence: `docs/operating-cadence.md` · Demo: `docs/demo-script.md`.
- Mobile motion + materiality: `docs/adr/0008-mobile-motion-and-materiality.md` (dark-default, serif headlines via Cormorant, breathing AuroraHalo, stagger=70ms, springs in `constants/motion.ts`, haptics in `hooks/useHaptics.ts`).
- Skills: `pnpm-workspace`, `clerk-auth`, `database`, `deployment`, `artifacts`, `react-vite`, `expo`, `canvas`, `mockup-sandbox`.
