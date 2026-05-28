# Screen inventory (generated)

**Generated:** 2026-05-20  
**Do not hand-edit** — run `node scripts/generate-screen-inventory.mjs` from the repo root.

## Mobile (Expo Router) — `artifacts/livia-mobile/app`

| Route file |
|------------|
| `app/(tabs)/approvals.tsx` |
| `app/(tabs)/bookings.tsx` |
| `app/(tabs)/customers.tsx` |
| `app/(tabs)/inbox.tsx` |
| `app/(tabs)/index.tsx` |
| `app/(tabs)/more.tsx` |
| `app/(tabs)/my-day.tsx` |
| `app/(tabs)/shops.tsx` |
| `app/+not-found.tsx` |
| `app/booking/[id].tsx` |
| `app/booking/new.tsx` |
| `app/customer/[id].tsx` |
| `app/customer/new.tsx` |
| `app/demo/[persona].tsx` |
| `app/demo/index.tsx` |
| `app/onboarding.tsx` |
| `app/services/index.tsx` |
| `app/settings.tsx` |
| `app/sign-in.tsx` |
| `app/staff/[id].tsx` |
| `app/staff/index.tsx` |

## API — paths from `lib/api-spec/openapi.yaml`

_Count: 41_

| Path |
|------|
| `/businesses` |
| `/businesses/{businessId}` |
| `/businesses/{businessId}/activity` |
| `/businesses/{businessId}/availability` |
| `/businesses/{businessId}/bookings` |
| `/businesses/{businessId}/bookings/{bookingId}` |
| `/businesses/{businessId}/communications` |
| `/businesses/{businessId}/communications/email/from` |
| `/businesses/{businessId}/communications/sms/available-numbers` |
| `/businesses/{businessId}/communications/sms/number` |
| `/businesses/{businessId}/communications/sms/provision-number` |
| `/businesses/{businessId}/communications/test-send` |
| `/businesses/{businessId}/conversations` |
| `/businesses/{businessId}/conversations/{conversationId}` |
| `/businesses/{businessId}/customers` |
| `/businesses/{businessId}/customers/{customerId}` |
| `/businesses/{businessId}/dashboard` |
| `/businesses/{businessId}/feature-flags` |
| `/businesses/{businessId}/invitations` |
| `/businesses/{businessId}/my-day` |
| `/businesses/{businessId}/services` |
| `/businesses/{businessId}/services/{serviceId}` |
| `/businesses/{businessId}/slots` |
| `/businesses/{businessId}/staff` |
| `/businesses/{businessId}/staff/{staffId}` |
| `/businesses/{businessId}/staff/{staffId}/services` |
| `/businesses/{businessId}/time-off` |
| `/businesses/{businessId}/time-off/{timeOffId}` |
| `/channels/sms/inbound` |
| `/healthz` |
| `/internal/cron/send-reminders` |
| `/me` |
| `/me/businesses` |
| `/me/businesses/{businessId}/membership` |
| `/onboarding/catalog` |
| `/onboarding/preview` |
| `/public/b/{slug}` |
| `/public/b/{slug}/book` |
| `/public/b/{slug}/chat` |
| `/public/b/{slug}/slots` |
| `/public/marketing/leads` |

## Notes

- Dashboard and internal web surfaces are not yet included in this generator; extend the script when those route trees should be tracked the same way.
- Map screens to OpenAPI operations in Linear or a design doc — this file is an index only.

