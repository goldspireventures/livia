# Feature triage SOP (Livia Inc)

**Owner:** Product + Engineering  
**When:** Any inbound feature request (support ticket, sales, founder DM, partner).

## 1. Classify in 2 minutes

| Bucket | Action |
|--------|--------|
| **P0 — trust/safety** | Data leak, wrong booking charged, AI booking without consent | Stop the line; incident channel |
| **P1 — revenue block** | Cannot book, cannot pay deposit, onboarding stuck >48h | Same-day triage; assign owner |
| **P2 — workflow pain** | Slow inbox, missing notification, confusing copy | Backlog with vertical + persona tag |
| **P3 — nice** | UI polish, new vertical pack screen | Quarterly; never before G2 gates |

## 2. Required fields (support ticket or Notion)

- `business_id`, `vertical`, `persona` (owner / staff / …)
- **Job-to-be-done** (one sentence)
- **Evidence:** screenshot, `request_id`, conversation id if Liv
- **Workaround exists?** yes/no

## 3. Decision rules (EU OS)

- Does it strengthen **self-serve onboarding** or **honest marketing**? → prioritize Phase 2–3.
- Does it need **US/JP** infra? → **defer** unless EU pilot blocked.
- Does it duplicate a tool customers already have (POS, accounting)? → **integrate** don’t rebuild unless wedge is booking+Liv.
- Regulatory (IE voice, deposits)? → link `docs/product/LIVIA-RESILIENCE-OPS-AND-TRUST.md` + legal review.

## 4. Ship bar

- OpenAPI + RBAC if API
- `docs/audits/marketing-vs-reality.md` if customer-facing claim
- E2E or REAL-WORLD step in `docs/testing/REAL-WORLD-E2E-GUIDE.md`

## 5. Weekly review

- Open tickets by category (`liv_error`, `billing`, `feature`)
- Top 3 stuck onboarding businesses (`POST /internal/cron/onboarding-stuck`)
- Close or convert to spec in `docs/product/LIVIA-COMPLETE-SYSTEM-SPEC.md`
