# Operating cadence

**Status:** living (2026-05-20)

## Monday parity score (mobile)

Re-scored after Phase 5 — Mobile flagship (Gate 2).

| Metric | Target | Actual |
|--------|--------|--------|
| OWNER daily-use surfaces on mobile | ≥ 70% | **11 / 14 ≈ 79%** |
| STAFF daily-use surfaces on mobile | 100% | **4 / 4 = 100%** |
| Native goodies (N1–N8) | ≥ 4 by Gate 2 | **4** (push N1, biometrics N2, haptics N8, native share sheet) |

### OWNER surface checklist

| Surface | Mobile |
|---------|--------|
| Today / cockpit | ✅ |
| Bookings | ✅ |
| Customers + create | ✅ |
| Staff + invite | ✅ |
| Services + create | ✅ |
| Public booking preview | ✅ |
| Inbox | ✅ |
| Settings → AI + Comms | ✅ |
| Brand / Billing | web-only (deliberate) |

### STAFF surface checklist

| Surface | Mobile |
|---------|--------|
| My Day | ✅ |
| My customers | ✅ |
| My week card | ✅ |
| Privacy digest | Phase D |

### Verification commands

```bash
pnpm --filter @workspace/livia-mobile run typecheck
pnpm --filter @workspace/eval run test
```

Push smoke (with device token registered): create a booking, or `POST /internal/cron/test-push` with `x-internal-cron-secret` and `{ "businessId": "..." }`.
