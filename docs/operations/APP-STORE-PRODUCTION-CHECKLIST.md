# App Store production checklist

Use before shipping **livia-mobile** to TestFlight / App Store and **app.livia-hq.com** to production traffic.

## 1. Environment (required)

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | API | Postgres (Supabase pooler 5432) |
| `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` | API + dashboard + mobile | Auth |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Mobile | Same `pk_` as dashboard |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile | Production API, e.g. `https://api.livia.io` |
| `EXPO_PUBLIC_DASHBOARD_URL` | Mobile | Web onboarding link, e.g. `https://app.livia.io` |
| `DASHBOARD_BASE_URL` | API | Email/deep links |
| `CORS_ALLOWED_ORIGINS` | API | `https://app.livia.io`, `https://livia.io` |
| `NODE_ENV=production` | API | Security + compression |

Copy from repo root [`.env.example`](../../.env.example) and [`artifacts/livia-mobile/.env.example`](../../artifacts/livia-mobile/.env.example).

## 2. Verify staging (smoke)

With API + dashboard + mobile pointed at **staging**:

```bash
pnpm e2e:prep
pnpm test:e2e:api
pnpm test:e2e:preflight
```

Manual path (founder / new owner):

1. Sign up (Clerk) — not demo gateway.
2. Create business (medspa or hair) on **web** or **mobile**.
3. Complete blocking onboarding: profile → hours → Liv → public link.
4. **Enter app** — dashboard/mobile not trapped at 100% tour.
5. Home shows **Activation welcome** with vertical copy + checklist.
6. No Luxe Salon / demo data unless user tapped **Load demo**.

## 3. Optional channels (product works without)

| Integration | Env | User-visible when missing |
|-------------|-----|---------------------------|
| Twilio SMS | `TWILIO_*` | Liv cannot SMS; inbox still works |
| Meta WhatsApp/IG | `META_*` | Social channels show setup in Settings |
| Anthropic | `ANTHROPIC_API_KEY` | Liv chat degraded / disabled |
| Stripe | `STRIPE_*` | Billing step optional in beta |

## 4. Data hygiene

- `LIVIA_DEMO_ENABLED=false` in production (or demo only on internal builds).
- Demo businesses not assigned to real signups.
- `pnpm run gate:production-ready` (if configured in your release process).

## 5. Mobile store metadata

- Privacy policy URL (platform legal accepted in-app).
- Support contact (Settings → Help or livia-hq.com/contact).
- Screenshots from **real vertical** (hair + medspa), not generic salon-only.

## 6. Post-release monitoring

- API `GET /healthz`
- Clerk dashboard: sign-up errors
- Sentry (mobile + API) for onboarding crashes

See [APP-STORE-READINESS.md](./APP-STORE-READINESS.md) for when anonymous scale is realistic.
