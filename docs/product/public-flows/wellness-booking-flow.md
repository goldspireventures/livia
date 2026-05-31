# Wellness — public booking flow (W5)

**Demo:** `serenity-wellness-cork` · **Playbook:** [`vertical-playbooks/wellness.md`](../vertical-playbooks/wellness.md)

---

## Flow

```text
/b/{slug} → treatment menu → therapist preference → datetime → intake notes (light)
→ confirm → visit token + package upsell link (R2)
```

## Steps

| # | Screen | Notes |
|---|--------|-------|
| 1 | Storefront | Calm imagery; soft typography |
| 2 | Services | Massage, facial, couples — duration visible |
| 3 | Slot | Room resource R2; therapist R1 |
| 4 | Intake | Contraindication checkbox — not clinical diagnosis |
| 5 | Confirm | `success-beat`; voucher attach R2 per VOUCHER-PACKAGE-SPEC |
| 6 | Post | Reminder 24h + 2h; visit token day-of |

## Screen cards

- [`w5.public.book.mobile.yaml`](../../design/screen-cards/w5.public.book.mobile.yaml)
- [`w5.public.visit.mobile.yaml`](../../design/screen-cards/w5.public.visit.mobile.yaml)

## Packages (R2)

Prepaid sessions → [`VOUCHER-PACKAGE-SPEC.md`](../VOUCHER-PACKAGE-SPEC.md)
