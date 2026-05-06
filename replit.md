# Livia

Premium AI-native multi-tenant OS for appointment-based service businesses (beauty/wellness/barber/tattoo/dental). Beachhead: EU/Ireland. AI character is **Liv**.

**Front door for engineers:** [`README.md`](./README.md) (repo map + run locally). Deep onboarding: [`docs/onboarding-engineer.md`](./docs/onboarding-engineer.md). Architectural decisions: [`docs/adr/`](./docs/adr/).

## Run & Operate

- `pnpm run typecheck` · `pnpm run build` · `pnpm --filter @workspace/api-spec run codegen` · `pnpm --filter @workspace/db run push`
- **Required env:** `CLERK_*`, `DATABASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_*`.
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
- Never reintroduce "Bliq" or use "Olivia" — both are CI-guarded.
- React Native Web `shadow*` / `pointerEvents` deprecation warnings are expected.

## Pointers

- Roadmap: `docs/launch-plan.md` · Cadence: `docs/operating-cadence.md` · Demo: `docs/demo-script.md`.
- Skills: `pnpm-workspace`, `clerk-auth`, `database`, `deployment`, `artifacts`, `react-vite`, `expo`, `canvas`, `mockup-sandbox`.
