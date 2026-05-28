# Local development (Windows / macOS / Linux)

Run the full onboarding → dashboard loop on your machine without Replit.

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io/) 10+
- Postgres (`DATABASE_URL` in repo-root `.env`)
- [Clerk](https://clerk.com/) keys in `.env` / artifact `.env` files

## One-time setup

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run codegen
```

On Windows, `pnpm install` uses a cross-platform `preinstall` guard (no `sh` required).

## Env templates

Copy [`.env.example`](../.env.example) → repo `.env`, then each artifact’s `.env.example` → `.env` (dashboard, **marketing**, **internal**, mobile).

## Start services

| Terminal | Command | URL | Env file |
|----------|---------|-----|----------|
| API | `pnpm run dev:api` | http://localhost:3000 | repo `.env` |
| Dashboard | `pnpm run dev:dashboard` | http://localhost:5173 | `artifacts/livia-dashboard/.env` |
| **Marketing (livia.io)** | `pnpm run dev:marketing` | http://localhost:5174 | `artifacts/livia-marketing/.env` |
| **Internal ops** | `pnpm run dev:internal` | http://localhost:5175 | paste `INTERNAL_OPS_SECRET` in UI |
| Mobile (simulator) | `pnpm run dev:mobile` | Expo **8083** | `artifacts/livia-mobile/.env` |
| Mobile (device) | `pnpm run dev:mobile:device` | QR → LAN | same |

### Physical device (Expo Go)

1. Install **Expo Go** on your phone (App Store / Play Store).
2. Phone and PC on the **same Wi‑Fi** (not guest network).
3. **Terminal 1:** `pnpm run dev:api` — API must be running before you open the app.
4. **Terminal 2:** `pnpm run dev:mobile:device` — prints your LAN API URL and a QR code.
5. Scan the QR with Expo Go (Android) or the Camera app (iOS).
6. If Windows Firewall prompts, allow **Node.js** on **private** networks.
7. Sign in with Clerk, then complete onboarding or open the main tabs.

If no QR appears, open **Expo Go** → **Enter URL manually** → `exp://<LAN-IP>:8083` (the script prints your IP).

`dev:mobile:device` sets `EXPO_PUBLIC_API_BASE_URL` to `http://<LAN-IP>:3000` and starts Metro with `--lan` so the phone can load the bundle. Do **not** use `dev:mobile` (localhost) on a real device.

Override the detected IP: `set LIVIA_DEV_HOST=192.168.8.241` then `pnpm run dev:mobile:device`.

### Environment

**Root `.env`** (API):

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
# Same Clerk app as dashboard/mobile publishable keys (fixes 401 from phone on LAN IP)
CLERK_PUBLISHABLE_KEY=pk_...
# Optional — required only for Liv AI chat / SMS replies
ANTHROPIC_API_KEY=sk-ant-...
```

Legacy `AI_INTEGRATIONS_ANTHROPIC_*` env names are still read if present; prefer `ANTHROPIC_API_KEY`.

**`artifacts/livia-dashboard/.env`**:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

Use the same Clerk **publishable** key as in the Clerk dashboard (same value as mobile below).

**`artifacts/livia-mobile/.env`**:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

For simulator-only, `dev:mobile` injects `http://localhost:3000`. For a physical device, use `dev:mobile:device` (no manual IP in `.env` required).
For simulator-only, `dev:mobile` injects `http://localhost:3000`. For a physical device, use `dev:mobile:device` (no manual IP in `.env` required).

## Pre-demo verification (run before testing on device)

**Terminal 1 — API** (must be Livia, not another app on port 3000):

```powershell
pnpm run dev:api
```

If port 3000 is taken, stop the other process or change `PORT` in `.env`.
If port 3000 is taken, stop the other process or change `PORT` in `.env`.

**Terminal 2 — smoke checks:**

```powershell
pnpm run smoke:demo
```

Expect: `healthz` **200**; unauthenticated `onboarding/catalog`, `dev/seed`, and `me/businesses` return **401** (not 404).

**Terminal 3 — mobile (physical device):**

```powershell
pnpm run dev:mobile:device
```

First bundle can take 1–2 minutes; reloads are fast. Use `pnpm run dev:mobile:device:clean` only if Metro acts stale.

## Mobile demo flow (E2E)

1. Sign in with Clerk (email or Google).
2. On onboarding, swipe to the **last slide** (“Set up your command center”).
3. Tap **Load demo workspace** — wait for success (no red error under the button).
4. You should land on **Today** with **Luxe Salon & Spa** (or another seeded business).
5. Tab bar: **Today**, **Bookings**, **Clients**, **Inbox**, **More**.
6. **Bookings** — list loads; tap a booking for detail.
7. **Clients** — list loads; **+** opens new client.
8. **More** — business switcher if multiple salons seeded.

If **Load demo workspace** fails, read the red error text:

| Error | Fix |
|-------|-----|
| Cannot reach the API | API not running, wrong Wi‑Fi, or Windows Firewall blocking Node |
| Internal server error / users does not exist | `pnpm run db:push` against a clean or migrated DB |
| Unauthorized | Add `CLERK_PUBLISHABLE_KEY=pk_...` to repo-root `.env` (same value as `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`), restart `pnpm run dev:api`, then sign out/in on the phone |

Public **demo gateway** (no Clerk): open `/demo` in the app after sign-in redirect, or navigate from marketing — see `artifacts/livia-mobile/app/demo/`.

## Onboarding E2E checklist

1. Sign in (Clerk) on mobile or dashboard.
2. Complete onboarding: **country**, **business type**, name, slug — **or** use **Load demo workspace**.
3. Confirm API seeded **services** and **staff** (`seedDefaults: true` or dev seed).
4. Dashboard: open **Clients** → **+** → create a client.
5. Mobile: **Inbox** lists conversations (empty until SMS/web chat traffic).
6. Public booking: `http://localhost:5173/b/{slug}` (or your dashboard base URL).
   - Deposit summary in header.
   - Booking terms on confirm step.
   - Liv chat uses **jurisdiction-localized** disclosure (from `@workspace/policy`).

## Smoke script

```powershell
pnpm run typecheck
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run test
pnpm run smoke:demo
```

## Full E2E testing

See **[`docs/testing/E2E-TESTING-GUIDE.md`](testing/E2E-TESTING-GUIDE.md)** — prep (`pnpm e2e:prep`), automated layers L0–L3, manual Clerk flows, Phase 10, Gate 3 ops.

## Database schema

Apply the Drizzle schema to the database in root `.env` (`DATABASE_URL` or `SUPABASE_DATABASE_URL`):

```powershell
pnpm run db:push
```

Uses `lib/db/scripts/drizzle-push.mjs` to load repo-root `.env` automatically (no manual env piping on Windows).

If drizzle-kit asks about enums on a database that still has the old Prisma schema, choose **create** for each new enum, or point `DATABASE_URL` at an empty database first. Destructive reset: `pnpm run db:push:force` (review prompts carefully).

## Troubleshooting

- **`relation "users" does not exist` / seed 500**: Run `pnpm run db:push` against a DB that matches the current Drizzle schema (see above). Legacy Prisma tables (`User`, `Business`, …) are not compatible — use a fresh database or drop old objects first.
- **Dashboard: `Missing Publishable Key`**: Add `VITE_CLERK_PUBLISHABLE_KEY=pk_...` to `artifacts/livia-dashboard/.env` (same Clerk publishable key as mobile), then restart `pnpm run dev:dashboard`.
- **Dashboard: `Cannot find module @rollup/rollup-win32-x64-msvc`**: Run `pnpm install` at repo root after pulling. If it persists, ensure `pnpm-workspace.yaml` does not override away win32 rollup binaries.
- **Port 3000 in use (`EADDRINUSE`)**: A previous API process is still running. On Windows:
  ```powershell
  netstat -ano | findstr ":3000"
  taskkill /PID <pid> /F
  ```
  Or close the terminal where `dev:api` was left running.
- **API 401**: Clerk token / `EXPO_PUBLIC_DOMAIN` must match the API host.
- **Expo can’t reach API / blank app on phone**: Use `pnpm run dev:mobile:device`, not `dev:mobile`. Confirm API is up (`curl http://<LAN-IP>:3000/api/healthz` or open that URL in the phone browser).
- **Expo stuck on `exp://localhost`**: Stop Metro and restart with `dev:mobile:device`.
- **Stale Metro**: `pnpm run dev:mobile:device` already passes `--clear`; or `npx expo start -c` in `artifacts/livia-mobile`.
