# Performance — how Livia is doing and what to do next

**Audience:** engineers + founder before beta load.  
**TL;DR:** Fine for demo and early tenants; a few hot paths still do extra DB round-trips; the dashboard loads every page upfront. Nothing is on fire, but there is clear headroom.

---

## Current health (honest)

| Layer | Demo / 1 shop | 10+ staff, busy day | Chain (many shops) |
|-------|---------------|---------------------|---------------------|
| **API** | Fast enough | Good if lists are paginated | Watch chain rollup + inbox fan-out |
| **Dashboard first paint** | Heavier than ideal (full route bundle) | Same | Same |
| **Postgres** | Indexed on `bookings(business_id, start_at)` etc. | Good | Per-tenant queries stay scoped |
| **Mobile** | Network + Expo bundle size | Same as web API | — |

You are **not** suffering from “monorepo size” at runtime — only **what each request loads** and **what the browser downloads on first visit** matter.

---

## Already in good shape

- **Booking lists** use `enrichBookingsBatch` (3 queries per page, not 3×N) — dashboard summary, morning briefing, demo live day.
- **Booking indexes** on `business_id`, `start_at`, `status`, `staff_id`, `customer_id`.
- **React Query** defaults: 30s `staleTime` on dashboard app — avoids refetch storms on tab flicker.
- **Public booking rate limit** (launch-plan E10) — protects API from chat abuse.
- **Inngest** for reminders/workflows — heavy work off the request path.
- **EU region** on business row (`eu_region`) — data locality when you pin hosting.

---

## Fixed in this pass

- **`getMyDay`** — was N+1 via `enrichBooking` per row; now one batched enrich for today + week.
- **API gzip** — `compression` middleware in production (`API_COMPRESS=true` in dev).
- **Dashboard routes** — `React.lazy` + `Suspense` for heavy pages (`lazy-pages.tsx`).
- **Today tab** — `LazyMount` for `VerticalHomeModules`, `VisitFeedbackStrip`, compact `LivCommandHub`.
- **Public booking** — chat widget lazy-loaded after idle; booking shell paints first.

---

## Backend — priority fixes

| Priority | Issue | Where | Fix |
|----------|--------|-------|-----|
| **P0** | Single-booking detail still 4+ queries | `enrichBooking` | Acceptable for one ID; keep batch for lists only |
| **P1** | Chain / franchise rollup queries | `chain-rollup.service.ts` | Profile with `EXPLAIN ANALYZE` under 5+ shops |
| **P1** | Inbox thread list + last message | `conversations.service.ts` | Ensure limit + index on `(business_id, updated_at)` |
| **P2** | Activity feed unbounded | `dashboard` activity | Cap at 50 (may already); cursor pagination |
| **P2** | AI chat on public booking | `public.ts` | Streaming + rate limit already; add CDN for static |
| **P3** | Cold start API | Node | Keep `build.mjs` bundle lean; lazy-import heavy SDKs (Stripe, Twilio) on first use |

### Quick wins (1–2 hours each)

1. **Audit remaining `enrichBooking` in loops** — grep `map(enrichBooking)`; batch or drop media fetch on list views.
2. **HTTP caching** — `GET /businesses/:id` with `ETag` or short `Cache-Control` for rarely changing shop profile.
3. **Compress JSON** — ensure `compression` middleware on API in production.
4. **Connection pool** — verify `DATABASE_URL` pool size (PgBouncer on Neon/Supabase).

### Medium (sprint)

1. **Background aggregation** — dashboard “flight plan” stats as a materialized snapshot refreshed every 60s (Inngest cron).
2. **Read replicas** — when EU traffic justifies it; route reporting to replica.
3. **Redis** — session-less API; use for rate limits + hot dashboard cache per `businessId`.

---

## Frontend — priority fixes

| Priority | Issue | Impact | Fix |
|----------|--------|--------|-----|
| **P0** | All routes imported in `App.tsx` | Large initial JS chunk | `React.lazy` + `Suspense` per heavy page (chain, medspa, franchise, portal…) |
| **P1** | Dashboard home stacks many widgets | Slow TTI on Today | Lazy-mount below-fold: `VerticalHomeModules`, `VisitFeedbackStrip` |
| **P1** | `framer-motion` on marketing | Marketing LCP | OK for marketing; don’t import motion on dashboard |
| **P2** | Clerk + full API client on boot | Main thread | Clerk is required; defer non-critical queries until after `business` resolved |
| **P2** | Images | LCP public booking | WebP, explicit width/height, `loading="lazy"` below fold |
| **P3** | `react-player` on onboarding | Only on `/onboarding` | Already lazy-click to play; keep |

### Quick wins

1. **Route-based code splitting** — see `lazy-routes.tsx` when added.
2. **`pnpm build` + `vite-bundle-visualizer`** — find top deps (recharts, lucide barrel imports).
3. **Lucide** — import icons by path: `import { Inbox } from "lucide-react"` (already mostly fine).
4. **Prefetch** — on hover sidebar link, `import()` prefetch next page (optional).

### Perceived speed (UX, not ms)

- Skeletons on dashboard/inbox (partially there).
- Optimistic updates on booking status change.
- Don’t block nav on `accept-invitations` (already fire-and-forget in `auth-guard`).

---

## Mobile (Expo)

- Use **LAN IP** in dev (`dev:mobile:device`) — localhost fails on device.
- **Hermes** enabled by default in modern Expo — keep it.
- Push registration after sign-in, not on every screen mount.
- Prefer **one** `useQuery` per tab with shared `queryKey` prefixes.

---

## How to measure before beta

```powershell
# Automated gate (tests + typecheck)
pnpm gate:production-ready

# API tests include booking batch behaviour
pnpm --filter @workspace/api-server run test

# Dashboard production bundle size
pnpm --filter @workspace/livia-dashboard run build
# Inspect artifacts/livia-dashboard/dist/public/assets/*.js sizes

# Optional: Lighthouse on public booking (local)
npx lighthouse http://127.0.0.1:5173/b/aurora-studio --only-categories=performance --chrome-flags="--headless"
```

**Targets (pragmatic beta):**

- Dashboard authenticated **LCP &lt; 3s** on mid laptop, production build.
- **GET /dashboard/summary** &lt; 300ms p95 with &lt; 30 upcoming bookings.
- **My Day** &lt; 200ms p95 for one staff member.

---

## Things easy to miss (checklist)

- [ ] Postgres **migrations applied** on prod (`db:migrate:sql` + `db:push`).
- [ ] **Sentry** sampling not 100% in prod (kills performance).
- [ ] **Inngest** dev vs prod keys — don’t run workflows synchronously in API by mistake.
- [ ] **Demo provision** on staging only — 18 businesses slow down unrelated QA.
- [ ] **Web push** VAPID — failure retries shouldn’t loop.
- [ ] **Clerk** session refresh on every `apiFetch` — use shared token getter (already in `ClerkAuthBridge`).
- [ ] **Logging** at `debug` in prod — disable verbose Drizzle SQL log.
- [ ] **CORS + cookies** — preflight on every request doubles mobile latency if misconfigured.

---

## Related docs

- `docs/launch-plan.md` — E9 Lighthouse, E10 rate limits, E12 N+1 cockpit (batch done).
- `docs/audits/marketing-vs-reality.md` — N+1 marked resolved for cockpit.
- `docs/product/UX-NAVIGATION.md` — fewer clicks beats raw ms for “feels fast”.
