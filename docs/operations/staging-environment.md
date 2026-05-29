# Staging environment

**Status:** Runbook — [`STAGING-SETUP.md`](./STAGING-SETUP.md) (provision + test web/mobile). Prep checklist — [`staging-prep-livia-hq.md`](./staging-prep-livia-hq.md).

| Env | API | Dashboard | Mobile | DB |
|-----|-----|-----------|--------|-----|
| **Local** | `:3000` / `:3001` | `:5173` | Expo | Supabase dev |
| **Staging** | `api.staging.livia-hq.com` *(not live)* | `app.staging.livia-hq.com` | TestFlight internal | Supabase staging project |
| **Production** | `api.livia-hq.com` | `app.livia-hq.com` | Stores / EAS | Supabase prod (EU) |

**Secrets:** repo-root `.env` local; staging/prod in vault — never commit.

**Smoke after deploy:** `pnpm test:e2e:api`, `GET /api/healthz`, one Clerk sign-in on staging dashboard.

**Cron:** `POST /internal/cron/onboarding-stuck?send=true` with `X-Internal-Cron-Secret` (staging only for nudge tests).
