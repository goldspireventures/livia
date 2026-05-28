# Livia full demo showcase — all verticals & scenarios

Use this after `pnpm e2e:prep` and **Set up full demo world** on http://localhost:5173/demo.

## Customer accounts (what we mean by “no global account”)

Each **business** has its own customer list (`customers.business_id`). When you book at `/b/paws-parlour-dublin` and `/b/clarity-medspa-dublin`, Livia creates **two customer records** (unless you reuse the same phone/email and the shop merges duplicates). There is no single “Mary’s Livia profile” across unrelated tenants — that is intentional (privacy + salon owns the relationship). **Merge suggestions** can link duplicates *within one shop*.

## Terminals

| # | Command | Port |
|---|---------|------|
| 1 | `pnpm dev:api` | 3001 |
| 2 | `pnpm dev:dashboard` | 5173 |
| 3 | `pnpm dev:marketing` | 5174 |
| 4 | `pnpm dev:internal` | 5175 |
| 5 | `pnpm dev:mobile:device` | Expo |

## Scenario map

| Scenario | How |
|----------|-----|
| Single-shop owner | `/demo` → **Owner** → Conor's Cut |
| Multi-location (one brand) | **Founder** → `/chain` → switch Aurora Studio / Mews / Galway |
| Multi-business operator | **Founder** → business switcher → Bloom, Harbour, Ink, Paws, Clarity, Motion, Peak |
| Pet grooming | `/b/paws-parlour-dublin` + owner → Customers → **Pets** panel |
| Medspa + consent | `/b/clarity-medspa-dublin` → consent step; owner → `/medspa` hub |
| Allied health / physio | `/b/motion-physio-cork` |
| Fitness / PT | `/b/peak-fitness-dublin` |
| v3 continuity + guards | `/b/luxe-salon-spa` (db seed) |
| Public “same person, many shops” | Incognito; book 3+ `/b/*` URLs with different phones |
| Internal ops | :5175 + `INTERNAL_OPS_SECRET` |

## All public booking URLs

```
/b/luxe-salon-spa
/b/aurora-studio
/b/aurora-mews
/b/aurora-galway
/b/conors-cut-co
/b/bloom-beauty-dublin
/b/harbour-wellness-cork
/b/ink-anchor-galway
/b/paws-parlour-dublin
/b/clarity-medspa-dublin
/b/motion-physio-cork
/b/peak-fitness-dublin
```

After **Reset demo world** on `/demo`, re-provision to create any missing vertical tenants (idempotent).

## Sign-in

`/demo` doors · password `LiviaDemo2026!` · emails `demo-*@livia.io`
