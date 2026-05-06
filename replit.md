# Livia

Premium AI-native multi-tenant operating system for appointment-based service businesses (beauty/wellness/barber/tattoo/dental). Beachhead: EU/Ireland. AI character is **Liv**.

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

**Env vars:** `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (api), `VITE_CLERK_PUBLISHABLE_KEY` (web), `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` + `EXPO_PUBLIC_DOMAIN` (mobile), `DATABASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_*` (provisioned via Replit AI Integrations).

**Observability env vars (optional, Gate-2):** `SENTRY_DSN_API` (api-server), `VITE_SENTRY_DSN` (dashboard), `SENTRY_RELEASE` / `VITE_SENTRY_RELEASE` (release tag). Omit to disable Sentry — SDKs no-op cleanly. `LOG_LEVEL` controls pino level. Codegen guard: `./scripts/check-codegen.sh`.

## Stack

pnpm workspace monorepo · TypeScript 5.9 · Node 24 · Express 5 · PostgreSQL + Drizzle ORM · Zod (`zod/v4`) + `drizzle-zod` · Orval API codegen · Vite (web) · Expo (mobile) · Clerk auth · Anthropic Claude (AI).

## Where things live

- `artifacts/api-server` — Express REST API at `/api`. Auth via `@clerk/express`.
- `artifacts/bliq-dashboard` — React + Vite owner dashboard (web). Auth via `@clerk/clerk-react`. Public booking at `/b/:slug`. *Directory still named `bliq-dashboard` — rename deferred to keep workflows + Clerk redirect URIs stable.*
- `artifacts/bliq-mobile` — Expo (React Native) iOS/Android. Same API. Auth via `@clerk/clerk-expo`. *Slug `bliq-mobile` + scheme `bliq-mobile` deliberately preserved — changing them breaks deep links.*
- `artifacts/mockup-sandbox` — design preview sandbox (canvas iframes).
- `lib/db` — Drizzle schema (14 tables incl. conversations), DB client, enums, status-transition helpers.
- `lib/api-spec` — OpenAPI source. `pnpm codegen` regenerates `lib/api-zod` and `lib/api-client-react`.
- `lib/integrations-anthropic-ai` — Anthropic SDK wrapper wired via Replit AI Integrations.

## Architecture decisions

- Booking creation is conflict-safe: Drizzle transaction + `pg_advisory_xact_lock` keyed by `businessId:staffId`, then conflict check + insert. Prevents double-booking under concurrency.
- Slot generation is timezone-aware via `artifacts/api-server/src/lib/tz.ts` (Intl longOffset → IANA → UTC). Day boundaries + weekday selection use the business timezone, not server's.
- AI chat (`services/ai-chat.service.ts`): Claude tool-loop, model `claude-sonnet-4-6`, `MAX_TOOL_HOPS=6`. Two tools: `find_slots` (calls existing `getAvailableSlots`) + `create_booking`. System prompt blends business name/category/`aiTone`/`aiGreeting`/`aiKnowledge` + enumerated services. Gated by `business.aiEnabled !== "false"` (text columns, "true"/"false").
- Generated React Query hooks use `{ query: UseQueryOptions<...> }` — pass enabled via `query: { enabled: ... } as any`.
- API field names: Staff/Customer use `displayName` (not `name`); Service uses `priceMinor`; Booking uses `startAt`/`endAt`; list responses use `.data[]`.
- Mobile mutations use `data` key: `useCreateBooking({ businessId, data })`, `useUpdateBooking({ businessId, bookingId, data })`.

## Brand — two layers

**Aurora (product surface).** Cinematic midnight base + violet→cyan→mint gradient. Cyan (`#06b6d4`) is the primary action color; violet (`#8b5cf6`) signals automated/assistant moments; mint (`#10b981`) for success. Tokens: dashboard `artifacts/bliq-dashboard/src/index.css` (`--color-aurora-*`, `--primary` cyan), mobile `artifacts/bliq-mobile/constants/colors.ts` (named `aurora` export). Utilities `.aurora-gradient`, `.aurora-gradient-text`, `.aurora-glass`, `.aurora-glow` — use sparingly.

**Aurum (wordmark accent).** Champagne/cream/bronze chrome reserved for the Livia wordmark + the italic *v*. Tokens: `--color-aurum-champagne #d9c39a`, `--color-aurum-cream #f6f3ec`, `--color-aurum-bronze #8a7549`, `--color-aurum-ink #0a0a10`. Mobile equivalents exported from `colors.ts` as `aurum`. Chrome gradient: `linear-gradient(180deg, #f6f3ec 0%, #d9c39a 45%, #8a7549 60%, #d9c39a 78%, #f6f3ec 100%)`. **Never use Aurum for action buttons** — it's brand-only.

**Type.** Display = Plus Jakarta Sans. Body/UI = Geist. Data = JetBrains Mono. **Wordmark = Cormorant Garamond** (italic *v*). Loaded in `artifacts/bliq-dashboard/index.html`. Radius `0.75rem` (12px).

**Logo mark:** `artifacts/bliq-dashboard/src/components/brand/BliqMark.tsx` (file rename deferred). Renders the Lv roundel — soft outlined circle, serif "L" in `currentColor`, italic chrome "v". Exports both legacy `BliqMark`/`BliqWordmark` and forward-looking `LiviaMark`/`LiviaWordmark` aliases. The full wordmark composition (roundel + serif "Livia" + tagline + "with Liv at your side" sub-line) is locked on canvas as `livia-wm-aurum` (artifact `XegfDyZt7HqfW2Bb8Ghoy`, position −550, 4900).

**Voice.** Precise, calm, slightly poetic. Empty states whisper, success toasts confirm, AI suggestions invite without pressuring.

**Tagline (final):** *For barbershops, tattoo studios, dental practices — and every appointment in between.*

## AI character

The AI is **Liv** — the brand's quiet helper. Liv has a name and a personality but is never marketed as the product. The product is Livia; Liv is what's under the hood.

## Compliance guardrails

- **Brand layer is silent on "AI"** — no "AI-powered" badges in marketing. Disclosure happens where it legally must:
  - Chat widget first message (EU AI Act Art. 50 — automated interaction disclosure).
  - Privacy policy + Terms of Service (GDPR Art. 22 — automated decision-making).
  - Anthropic AUP compliance copy on the public booking page.
- One private name to never surface in any artifact, copy, repo file, or UI string: **Olivia** (founder's daughter — kept private).

## Product surfaces

**Dashboard pages (`artifacts/bliq-dashboard/src/pages/`):** dashboard (Cockpit), bookings, customers, services, staff, availability, time-off, inbox (AI conversations), settings (Tabs: General / AI Assistant / Demo & Data), onboarding, sign-in, sign-up, public-booking (`/b/:slug`).

**Mobile screens (`artifacts/bliq-mobile/app/`):** dashboard, bookings, customers, more (tab), booking detail/new, customer detail, staff list/detail, services, sign-in, onboarding. All TS-clean.

**AI Inbox wedge (Wave 2, shipped May 5):** customers chat → Liv books → owner sees the thread, can take over, configure tone/greeting/knowledge/auto-book. Schema in `lib/db/src/schema/conversations.ts` (`conversations`, `conversationMessages`, +5 AI columns on `businesses`). Public chat: `POST /api/public/b/:slug/chat`. Owner views: `GET /api/businesses/:id/conversations[/:cid]`, `PATCH` for take-over/close. Widget: `components/chat-widget.tsx` (FAB on `/b/:slug`). Inbox UI: `pages/inbox.tsx` (two-pane, polls 10s list / 5s thread).

**Demo data:** `POST /api/dev/seed` (3 demo businesses, idempotent), `DELETE /api/dev/seed` (wipes calling user's businesses, cascades). Both 403 in production. Reusable component: `components/demo-data-controls.tsx`.

## Cockpit dashboard (graduated May 5)

Production dashboard at `artifacts/bliq-dashboard/src/pages/dashboard.tsx` is the Cockpit design (one of three canvas explorations — Cockpit / Atrium / Concierge in `mockup-sandbox/src/components/mockups/bliq-dashboards/`). Live timeline spine 8am–8pm @ 96px/hour, greedy interval-packing into lanes, current-time marker (60s tick), action queue + staff-on-shift derived from same `summary.upcomingBookings` payload (PENDING+CONFIRMED+COMPLETED, today + 7d, limit 40). All Aurora colors via semantic tokens + chart vars so light/dark both work. Layout content max-width `1600px`. **Known follow-up:** `enrichBooking` in `dashboard.service.ts` is N+1 per booking — acceptable at single-business scale, batch when latency regresses.

## Auth (Clerk)

- Clerk app titles overridden via provider-level `localization` in `App.tsx` ("Sign in to Livia" / "Create your Livia account"). Per-component `localization` does NOT override the provider — set once at provider.
- Appearance themed for Aurora: `colorPrimary: "#06b6d4"`, `fontFamily: Geist`, `borderRadius: "0.75rem"`.
- Use `signInFallbackRedirectUrl` / `signUpFallbackRedirectUrl` (not deprecated `fallbackRedirectUrl`).
- `proxyUrl` set only in production builds (`import.meta.env.PROD`).
- Mobile sign-in is fully custom (not Clerk hosted UI): 3 modes (sign-in / sign-up / verify-OTP), Google OAuth via `useOAuth({ strategy: "oauth_google" })` with `WebBrowser.maybeCompleteAuthSession()` at module scope. Redirect URI generated per-platform via `AuthSession.makeRedirectUri({ scheme: "bliq-mobile", path: "oauth-callback" })` — never hardcoded. Errors mapped via `humanizeAuthError`.

## Mobile premium polish

- Aurora ambient backdrop = 3 absolutely-positioned `LinearGradient` orbs (violet/cyan/mint, 0.2-0.3 alpha) behind content. Used on sign-in + dashboard. See `AuroraBackdrop` in `app/sign-in.tsx`.
- Brand mark = 56×56 dark gradient square with serif "L" + italic champagne "v" (Aurum-aligned).
- Gradient CTAs use `LinearGradient` + cyan-tinted shadow + `Pressable` with `transform: scale(0.97)` press state.
- `expo-haptics`: `Light` on form interactions, `Medium` on primary CTAs. Always `Platform.OS !== "web"` guarded.
- `StatsCard` has `variant: "default" | "hero"` — hero wraps in 1px Aurora gradient border.

## Demo readiness (Task #23, partial)

- **Visual token sweep:** removed every `bg-yellow-500 / text-green-500 / text-red-500 / text-yellow / bg-green-500 / bg-gray-50 / text-gray-900` from dashboard pages (bookings, booking-detail, customer-detail, staff, staff-detail, inbox, public-booking, not-found). All status colors now route through `--chart-3` (success/mint), `--chart-4` (warning), `--destructive`, `--primary`. Mobile `StatusBadge.tsx` rebuilt to use `colors` + `aurora` tokens.
- **Wow moments shipped:**
  - Champagne shimmer + soft three-note Web-Audio chime on the public booking confirmation. Code: `artifacts/bliq-dashboard/src/lib/celebrate.ts` + `.celebrate-shimmer` keyframe in `index.css`.
  - One-shot welcome aurora sweep on dashboard cockpit first-mount per browser session — `.welcome-sweep` keyframe in `index.css`, gated via `sessionStorage["livia.welcomeSweep"]`.
  - All wow moments respect `prefers-reduced-motion` and the global `localStorage["livia.celebrate"] = "off"` kill switch.
- **Demo script:** `docs/demo-script.md` — founder-narratable 90-second walkthrough, reset-between-demos workflow, kill-switch instructions.
- **Reset-demo path:** already wired — `Settings → Demo & Data` renders `<DemoDataControls variant="settings" />` with both reload + wipe.
- **Deferred** to the queued "Livia post-demo launch plan" follow-up: Playwright E2E + CI wiring, Lighthouse 90+ audits, full architect-review pass, "Liv made you €X today" cockpit line (needs `bookings.sourceConversationId` schema column + OpenAPI/codegen ripple), public-booking auto-generated `og:image`, mobile pull-to-refresh haptic spinner, full mobile state-coverage walk.

## Gotchas

- **Always `pnpm run typecheck` before declaring done** — generated hooks + Zod schemas have strict shapes that ripple.
- **Don't rename `bliq-mobile` slug or scheme** — breaks deep links and Google OAuth callback.
- **Don't change mobile `STORAGE_KEY = "bliq_current_business_id"`** in `BusinessContext.tsx` — would orphan stored business selections on existing devices.
- **Aurum is brand-only**, never use champagne for action buttons. Cyan stays the primary action color. The one sanctioned exception is the celebrate shimmer (`.celebrate-shimmer`) — a one-shot champagne sweep on booking confirmation.
- **`business?.name.charAt(0)` fallback** in `app-layout.tsx` still shows "B" when business name is empty — cosmetic, defer until directory rename round.
- **`shadow*` / `pointerEvents` deprecation warnings** from React Native Web are expected until Expo upstream ships fixes; they do not block the demo.

## Observability (Gate-2 floor, Task #25)

- **Sentry**: api-server (`@sentry/node`) + dashboard (`@sentry/react`). Init gated by DSN env vars (`SENTRY_DSN_API`, `VITE_SENTRY_DSN`). Express error handler wired via `Sentry.setupExpressErrorHandler` before the JSON 500 responder. Mobile (`@sentry/react-native`) deferred — needs Expo native plugin + dev-client rebuild that would break the Expo Go workflow.
- **Structured request logging**: `pino-http` in `artifacts/api-server/src/app.ts` emits `request_id` (from `x-request-id` header or random UUID, echoed back), `tenant_id` (parsed from `/businesses/:id/` URL or `x-business-id` header), `user_id` (Clerk auth), `method`, `path`, `status`, `responseTime`. Log level via `customLogLevel`: 5xx→error, 4xx→warn, else info.
- **OpenAPI guard**: `scripts/check-codegen.sh` runs codegen and fails on `git status --porcelain` diff in `lib/api-client-react`/`lib/api-zod`/`lib/api-spec`. Wired into `.github/workflows/ci.yml` (typecheck + codegen-guard) for when the GitHub repo is connected.
- **Source-map upload** to Sentry deferred — needs `SENTRY_AUTH_TOKEN` from founder + `@sentry/vite-plugin` wiring. SDKs work without it.

## Pointers

- Skills: `pnpm-workspace`, `clerk-auth`, `database`, `deployment`, `artifacts`, `react-vite`, `expo`, `canvas`, `mockup-sandbox`.
- **Roadmap source of truth: `docs/launch-plan.md`** — 5 lanes (Engineering / Brand / Compliance / Launch ops / GTM), 3 gates (Demo Day ✅ / Closed Beta / Public Launch). Updated weekly. Legacy `.local/tasks/RELEASE-PLAN.md` + `01-…17-*.md` are archived (superseded; project tasks #6–#22 CANCELLED).
- **Operating cadence:** `docs/operating-cadence.md` (weekly review, daily build, release + incident protocol, design-partner rhythm).
- **Engineer onboarding:** `docs/onboarding-engineer.md` — read this first before any PR.
