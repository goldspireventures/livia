# RFC 0010 — Multi-shop billing and chain rollup

**Status:** Accepted (Phase 10)  
**Date:** 2026-05-20

## Problem

Chain and Chair-Host tiers bill **per shop** or **per renter**, not as a single flat subscription. Owners need a **rollup view** across shops they own without merging tenant data or breaking RLS.

## Decision

1. **Billing unit remains one Stripe subscription per `business` row** (shop). Chain checkout uses **quantity = shop count** (min 2) on `STRIPE_PRICE_CHAIN`. Host checkout uses base + seat line items on `STRIPE_PRICE_CHAIR_HOST` with `renterCount`.
2. **No org table in v1.5** — chain rollup is derived from `businesses.owner_id = userId` (same owner, multiple shops). A future `chain_organizations` table may link shops explicitly.
3. **`GET /me/chain-rollup`** returns per-shop KPIs + totals for OWNER-only; never exposes other tenants' PII.
4. **Entitlements** come from `planId` on each shop; Chain/Host plans are in `PLAN_CATALOGUE` and checkout via `CHECKOUT_PLAN_IDS`.

## Non-goals (this RFC)

- Consolidated Stripe invoice across shops (finance ops manual for v1.5).
- Cross-shop staff scheduling (see RFC 0011).

## Rollout

- Env: `STRIPE_PRICE_CHAIN`, `STRIPE_PRICE_CHAIR_HOST`.
- Dashboard: `/chain` when user owns ≥2 businesses.
- Dev fallback: `setBusinessPlanForDev` accepts `chain` and `chair-host`.
