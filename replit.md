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
- **Wave 1 (active):** Brand & visual identity (Task #18), brand definition (#6), personas/ICP (#7).
- Brand exploration in progress on the canvas — three directions (Aurora, Atelier, Pulse) under `artifacts/mockup-sandbox/src/components/mockups/brand-explorations/`. User picks the winner; that becomes the design-system source of truth.

## Auth / Clerk Notes

- Clerk app name "Bliq Goldspire" (auto-generated) is overridden client-side via `localization` on `<ClerkProvider>` in `artifacts/bliq-dashboard/src/App.tsx` — sets `signIn.start.title` and `signUp.start.title` to "Sign in to Bliq" / "Create your Bliq account". Per-component `localization` props on `<SignIn>` / `<SignUp>` do NOT override the provider — set it once at the provider level.
