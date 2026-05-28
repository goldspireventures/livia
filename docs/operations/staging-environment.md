# Staging environment

**Status:** L7 (2026-05-21)

| Env | API | Dashboard | Mobile | DB |
|-----|-----|-----------|--------|-----|
| **Local** | `:3001` | `:5173` | Expo | Supabase dev branch |
| **Staging** | `api.staging.livia.io` | `app.staging.livia.io` | TestFlight internal | Supabase staging project |
| **Production** | `api.livia.io` | `app.livia.io` | Stores | Supabase prod (EU region) |

**Secrets:** repo-root `.env` local; staging/prod in vault — never commit.

**Smoke after deploy:** `pnpm test:e2e:api`, `GET /api/healthz`, one Clerk sign-in on staging dashboard.

**Cron:** `POST /internal/cron/onboarding-stuck?send=true` with `X-Internal-Cron-Secret` (staging only for nudge tests).
