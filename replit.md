# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Bliq Application

Multi-tenant, AI-native operating system for appointment-based service businesses.

### Artifacts

- `artifacts/api-server` — Express 5 + Drizzle + Postgres REST API. Mounted at `/api`. Auth via Clerk (`@clerk/express`).
- `artifacts/bliq-dashboard` — React + Vite owner dashboard mounted at `/`. Auth via `@clerk/clerk-react`. Public booking page at `/b/:slug` lives outside auth guard.
- `artifacts/bliq-mobile` — Expo (React Native) mobile app for iOS/Android. Shares the same API server. Auth via `@clerk/clerk-expo`.
- `artifacts/mockup-sandbox` — design preview sandbox.

### Packages

- `lib/db` — Drizzle schema (12 tables), DB client, enums, status-transition helpers.
- `lib/api-spec` — OpenAPI source, `pnpm codegen` regenerates `lib/api-zod` (Zod schemas) and `lib/api-client-react` (React Query hooks).

### Mobile App Screens (artifacts/bliq-mobile)

All screens pass TypeScript with zero errors.

| Screen | File | Description |
|---|---|---|
| Dashboard | `app/(tabs)/index.tsx` | Stats cards, upcoming bookings, + Book button |
| Bookings | `app/(tabs)/bookings.tsx` | Filterable list (upcoming/today/past/all) |
| Clients | `app/(tabs)/customers.tsx` | Searchable customer list |
| More | `app/(tabs)/more.tsx` | Staff/Services nav, business card, sign out |
| Booking Detail | `app/booking/[id].tsx` | Status badge, info cards, status-action buttons |
| New Booking | `app/booking/new.tsx` | Client picker, service/staff chips, start time |
| Client Detail | `app/customer/[id].tsx` | Profile + recent bookings |
| Staff List | `app/staff/index.tsx` | Staff rows with avatar + active badge |
| Staff Detail | `app/staff/[id].tsx` | Profile, active toggle, assigned services |
| Services | `app/services/index.tsx` | Services list with duration + price |

### Mobile App Architecture

- `app/_layout.tsx` — ClerkProvider + tokenCache (AsyncStorage) + QueryClientProvider + AuthGate (redirect to /sign-in when unauthenticated) + BusinessProvider
- `contexts/BusinessContext.tsx` — fetches `/api/me/businesses`, holds `currentBusiness`, redirects to onboarding when none
- `hooks/useColors.ts` — theme-aware color palette (light/dark via `useColorScheme`)
- `components/BookingCard.tsx` — booking row using `startAt`/`endAt`/`displayName` API fields
- `components/CustomerCard.tsx` — customer row using `displayName ?? firstName`
- `components/StatsCard.tsx`, `EmptyState.tsx`, `StatusBadge.tsx`, `ErrorBoundary.tsx`

### Dashboard Variants (canvas exploration, May 5)

Three post-login dashboard layout hypotheses live in `artifacts/mockup-sandbox/src/components/mockups/bliq-dashboards/` and are pinned to the canvas (artifact `XegfDyZt7HqfW2Bb8Ghoy`, row at y=2950). Same data shape, three distinct mental models.

| Variant | Mental model | Hero | Status |
|---|---|---|---|
| `Cockpit.tsx` | Dashboard-as-cockpit (Linear/Bloomberg) | Live timeline spine + queue rail + KPI tiles | **GRADUATED → `bliq-dashboard/src/pages/dashboard.tsx`** |
| `Atrium.tsx` | Dashboard-as-front-porch (Apple Health/Mercury) | Single "Next up" hero card + ambient AI nudge | On canvas (kept for record) |
| `Concierge.tsx` | Dashboard-as-conversation (Stripe feed/Superhuman) | Stack of 4-5 AI proposal cards w/ inline actions | On canvas (kept for record) |

All variants render the same `summary` + `upcomingBookings` + `activityFeed` shape and use Aurora tokens inline (no `index.css` edits). Mockup sandbox URLs: `/__mockup/preview/bliq-dashboards/{Cockpit,Atrium,Concierge}`.

#### Cockpit graduation (May 5)

The production dashboard at `artifacts/bliq-dashboard/src/pages/dashboard.tsx` is the Cockpit design wired to real API:
- KPIs from `useGetDashboardSummary`. Activity Log from `useGetActivityFeed`. Action Queue + Live Timeline + Staff on Shift all derived from `summary.upcomingBookings`.
- Backend (`dashboard.service.ts`) was widened: `upcomingBookings` now includes PENDING + CONFIRMED + COMPLETED across `[todayStart, todayStart + 7d]` (limit 40) so the same payload powers the queue, timeline, and staff derivation. Filtering to "today" happens client-side.
- Action Queue mutates via `useUpdateBooking` and invalidates `dashboard-summary`, `list-bookings`, and `activity-feed` query keys.
- Live Timeline: 8am–8pm spine, 96px/hour. Greedy interval-packing assigns each booking to the lowest free lane (handles N overlapping bookings); container height scales with lane count. Current-time marker reactive via 60s `setInterval`. Blocks crossing 08:00/20:00 are width-clipped to the visible window.
- Staff on Shift: derived client-side by grouping today's bookings by `staff.id` (no separate utilization API yet).
- All Aurora colors come from semantic tokens (`bg-card`, `border-border`, `text-primary`) and chart vars (`hsl(var(--chart-3))` mint, `hsl(var(--chart-4))` amber) so light/dark theme both work.
- App layout content max-width bumped from `max-w-6xl` → `max-w-[1600px]` to give the timeline horizontal room.
- **Known follow-up:** `enrichBooking` in dashboard summary is N+1 per booking. Acceptable at single-business scale; replace with batched join if list/limit grows or latency regresses.

### Key Design Decisions

- Booking creation is conflict-safe: wrapped in a Drizzle transaction with `pg_advisory_xact_lock` keyed by `businessId:staffId`, then conflict check + insert. This prevents double-booking under concurrent requests.
- Slot generation is timezone-aware via `artifacts/api-server/src/lib/tz.ts` (uses `Intl.DateTimeFormat` longOffset to convert IANA tz local time to UTC). Day boundaries and weekday selection use the business timezone.
- Centralized error middleware in `app.ts` returns JSON `{error: "..."}` for unknown routes (404) and uncaught exceptions (500).
- Clerk dev keys: `proxyUrl` only set in production builds (`import.meta.env.PROD`). In dev, the dashboard talks to Clerk directly.
- Generated React Query hooks use `{ query: UseQueryOptions<...> }` shape — pass enabled flags via `query: { enabled: ... } as any` cast.
- Mobile mutations use `data` key: `useCreateBooking({ businessId, data })`, `useUpdateBooking({ businessId, bookingId, data })`, `useUpdateStaff({ businessId, staffId, data })`.
- API field names: Staff/Customer use `displayName` (not `name`); Service uses `priceMinor` (not `price`); Booking uses `startAt`/`endAt` (not `startTime`/`endTime`); list responses use `.data[]` (not `.items[]`).

### Env vars

- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — server (api-server)
- `VITE_CLERK_PUBLISHABLE_KEY` — dashboard
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — mobile app
- `DATABASE_URL` — Postgres
- `EXPO_PUBLIC_DOMAIN` — injected at workflow start from `$REPLIT_DEV_DOMAIN`; used as API base URL in mobile app

## Roadmap & Active Work

- 7-wave product roadmap lives in `.local/tasks/RELEASE-PLAN.md`. 17 detailed task plans in `.local/tasks/*.md` (project tasks #6–#22).
- **Wave 1 (active):**
  - ✅ Brand definition (#6) — three explorations on canvas (Aurora / Atelier / Pulse), user picked **Aurora**.
  - ✅ Design system (#18) — Aurora tokens shipped to dashboard `index.css` + mobile `constants/colors.ts`. Sign-in/up branded.
  - ⏳ Personas / ICP (#7) — next.

## Brand System — Aurora

Bliq's visual identity is **Aurora** — modern premium AI: cinematic midnight base + a violet→cyan→mint gradient as the AI energy signal.

**Tokens (source of truth):**
- Colors: violet `#8b5cf6`, cyan `#06b6d4` (primary), mint `#10b981`, midnight `#09090b`. Warning `#f59e0b`, destructive `#ef4444`.
- Fonts: **Plus Jakarta Sans** (display), **Geist** (body/UI), **JetBrains Mono** (data). Loaded in `artifacts/bliq-dashboard/index.html`.
- Radius: `0.75rem` (12px). Aurora is a softer, rounder system than the prior 8px default.

**Where the tokens live:**
- Dashboard CSS vars: `artifacts/bliq-dashboard/src/index.css` — `--primary` is cyan `188 95% 43%`; dark mode is the canonical Aurora theme. Brand colors are also exposed as Tailwind utilities (`bg-aurora-violet`, `text-aurora-cyan`, `bg-aurora-mint`) via the `@theme` block.
- Dashboard utilities: `.aurora-gradient`, `.aurora-gradient-text`, `.aurora-glass`, `.aurora-glow` — use `aurora-gradient-text` for taglines and `aurora-gradient` for AI-energy buttons/badges. Use sparingly.
- Mobile palette: `artifacts/bliq-mobile/constants/colors.ts` — same Aurora mapping. Exports a named `aurora` object with the three brand hexes.
- Logo mark: `artifacts/bliq-dashboard/src/components/brand/BliqMark.tsx` — gradient SVG + `<BliqWordmark>`.
- Brand showcase pages (reference for future brand work): `artifacts/mockup-sandbox/src/components/mockups/brand-explorations/Aurora.{tsx,css}`. Atelier and Pulse are kept on disk for archival/comparison.

**Voice:** precise, calm, slightly poetic. Empty states whisper, success toasts confirm, AI suggestions invite without pressuring. Examples in `Aurora.tsx` section 7.

## Auth / Clerk Notes

- Clerk app name "Bliq Goldspire" (auto-generated) is overridden client-side via `localization` on `<ClerkProvider>` in `artifacts/bliq-dashboard/src/App.tsx` — sets `signIn.start.title` and `signUp.start.title` to "Sign in to Bliq" / "Create your Bliq account". Per-component `localization` props on `<SignIn>` / `<SignUp>` do NOT override the provider — set it once at the provider level.
- Clerk appearance variables (also in `App.tsx`) are themed for Aurora: `colorPrimary: "#06b6d4"`, `fontFamily: Geist`, `borderRadius: "0.75rem"`. Sign-in/sign-up pages use `<BliqMark />` and `aurora-gradient-text` for the branded hero.
