# Visual & screen acceptance testing

**Status:** canonical (2026-05-31)  
**Purpose:** Every P0 screen has **visual + functional** acceptance — tied to screen cards and master inventory.

**Reads with:** [`VISUAL-SCREEN-MASTER-INVENTORY.md`](../design/VISUAL-SCREEN-MASTER-INVENTORY.md) · [`SCREEN-CARD-SCHEMA.md`](../design/SCREEN-CARD-SCHEMA.md) · [`FULL-TESTING-INSTRUCTIONS.md`](./FULL-TESTING-INSTRUCTIONS.md)

---

## 1. Test layers per screen

| Layer | Tool | When |
|-------|------|------|
| **Functional E2E** | Playwright `e2e/tests/` | CI on every PR |
| **Visual regression** | Playwright screenshot vs northstar/PNG | P0 screens in CI |
| **Mobile native** | Maestro flows | Staff critical paths |
| **Manual design QA** | Compare to screen card YAML | Before release |
| **Accessibility** | axe in Playwright | `/b` + dashboard P0 |

---

## 2. P0 acceptance matrix

| Screen ID | E2E spec | Visual baseline | axe | Maestro |
|-----------|----------|-----------------|-----|---------|
| w5.public.book | `public-booking-quality.spec.ts` | `public-book-mobile.png` | ✅ | — |
| w5.public.proof | `public-booking-quality.spec.ts` | `guest-proof-mobile.png` | ✅ | — |
| w4.ops.my-day | `all-verticals-smoke.spec.ts` | `tenant-today-mobile.png` | | `my-day.yaml` |
| w4.owner.dashboard | `dashboard-smoke` (add) | `tenant-inbox-web.png` | ✅ | — |
| w4.ops.inbox | inbox tests (add) | inbox ns | ✅ | — |
| w2.gateway.demo.wedge | `full-platform-demo.spec.ts` | G1 tattoo | | — |
| w1.marketing.home | `marketing-gate` | M1 R2 | | — |
| w2.gateway.onboarding | onboarding flow | — | | — |
| w4.ops.design-proofs | body-art smoke | proofs ns | | — |
| w4.owner.chain | founder smoke | — | | — |

**New specs to add (doc sprint → build):**

- ✅ `demo-live-day.spec.ts` — today non-empty after provision
- ✅ `demo-proof-token.spec.ts` — guest proof E2E
- ✅ `visual-screen-p0.spec.ts` — P0 density smoke (testids)
- ✅ `northstar-p0-pixel.spec.ts` — pixel diff vs `livia-evolution/northstar/*.png`
- ✅ `pnpm northstar:check` — docs/public northstar PNG sync (CI verify job)
- `preset-public-parity.spec.ts` — change accent → `/b` updates

---

## 2b. Full P0 E2E / visual map (24)

| Screen ID | Functional E2E | Visual baseline |
|-----------|----------------|-----------------|
| w5.public.book.mobile | `public-booking-quality`, `all-verticals-smoke` | northstar public-book |
| w5.public.proof.mobile | `demo-proof-token`, body-art smoke | guest-proof |
| w5.public.visit.mobile | booking continuity smoke | — |
| w5.public.intake.mobile | medspa smoke | — |
| w5.public.pay.mobile | — (R2) | — |
| w4.staff.my-day.mobile | `all-verticals-smoke` | tenant-today-mobile |
| w4.owner.dashboard.web | dashboard smoke | tenant-inbox-web |
| w4.owner.chain.web | founder/chain smoke | — |
| w4.ops.inbox.web | inbox routes | inbox ns |
| w4.ops.settings.web | settings smoke | — |
| w4.ops.bookings.list.web | bookings smoke | — |
| w4.ops.bookings.new.web | create booking | — |
| w4.ops.design-proofs.web | body-art smoke | proofs ns |
| w4.ops.medspa.hub.web | medspa smoke | — |
| w4m.notifications.mobile | mobile smoke | — |
| w4m.founder.shops.mobile | founder mobile | — |
| w2.gateway.sign-in.web | auth smoke | G1 wedge |
| w2.gateway.onboarding.web | onboarding flow | — |
| w2.gateway.legal-accept.web | legal gate | — |
| w2.gateway.demo.launcher.web | `full-platform-demo` | G1 grid |
| w2.gateway.demo.wedge.web | `full-platform-demo` | G1 tattoo |
| w1.marketing.home.web | `marketing-gate` | M1 R2 |
| w1.marketing.pricing.web | marketing smoke | M2 |
| w3.support.thread.web | internal smoke | i4-thread |

---

## 3. Visual regression rules

```typescript
// e2e/tests/visual-screen-p0.spec.ts (target)
test('w5.public.book matches northstar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/b/clarity-medspa-dublin');
  await expect(page).toHaveScreenshot('w5-public-book-medspa.png', {
    maxDiffPixelRatio: 0.05,
  });
});
```

- Viewport fixed per screen card `visual.canvas.device`
- Mask dynamic timestamps
- Run on CI with `--update-snapshots` only on design approval PRs

---

## 4. Screen card → test traceability

Each screen card `acceptance` block:

```yaml
acceptance:
  human:
    - "Book completes in under 90s on 390px viewport"
  e2e:
    - spec: public-booking-quality.spec.ts
      test: "medspa consent step visible"
  visual:
    - baseline: northstar/public-book-mobile.png
  a11y:
    - wcag: AA
    - targets: 44px min
```

---

## 5. Demo validation script

Before founder demo / Gate 2:

```powershell
pnpm test:e2e:verticals
pnpm test:e2e:public-booking
pnpm exec node scripts/validate-demo-live.mjs  # target — checks seed depth per DEMO-WORLD-LIVE-SPEC
```

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial visual acceptance program |
