# Voucher & package products — wellness specification

**Status:** canonical draft (2026-05-31)  
**Audience:** product, engineering, finance  
**Purpose:** Prepaid **packages** and **gift vouchers** for wellness, beauty, and fitness — session bundles, expiry, partial redemption.

**Gap:** Single-service checkout exists; multi-session packages are a common wellness GTM ask.

---

## 1. Product types

| Type | Example | Redemption |
|------|---------|------------|
| **Session package** | 10× massage | Decrement on completed booking |
| **Gift voucher** | €100 credit | Balance until exhausted |
| **Membership bundle** | Monthly 4-class pack | Recurring + rollover rules (R3) |

---

## 2. Model

```typescript
type PackageProduct = {
  id: string;
  businessId: string;
  name: string;
  sessionCount: number | null; // null = monetary voucher
  priceCents: number;
  validityDays: number | null;
  serviceIds: string[]; // empty = any eligible service
};

type CustomerPackageBalance = {
  id: string;
  customerId: string;
  packageProductId: string;
  sessionsRemaining: number | null;
  balanceCents: number | null;
  expiresAt: string | null;
};
```

---

## 3. Checkout & booking

1. Customer buys package on `/b` or staff sells in dashboard (R2).
2. At book time: optional "Use package" if balance covers service.
3. On `booking.completed`: decrement session or balance; log in `package_redemptions`.

Refunds: founder policy — partial credit only if unused sessions remain.

---

## 4. Surfaces

| Surface | R2 scope |
|---------|----------|
| **Owner catalog** | Create/edit packages |
| **Customer `/my`** | Balance + history (guest hub) |
| **Receipt** | Shows sessions remaining |
| **Stripe** | One-time product SKU per package |

---

## 5. Vertical priority

| Vertical | Priority |
|----------|----------|
| wellness | P1 |
| fitness | P1 |
| beauty | P2 |
| hair | P3 (defer) |

---

## 6. Related

- [`NOTIFICATIONS.md`](./NOTIFICATIONS.md) — purchase confirm template
- [`GUEST-CONTINUITY-HUB-SPEC.md`](./GUEST-CONTINUITY-HUB-SPEC.md)
- [`vertical-playbooks/wellness.md`](./vertical-playbooks/wellness.md)

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial voucher/package spec |
