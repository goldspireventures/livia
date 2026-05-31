# Resource inventory — rooms, bays, class capacity

**Status:** canonical draft (2026-05-31)  
**Audience:** product, engineering  
**Purpose:** Bookable **resources** beyond staff — treatment rooms, bays, class slots — for medspa, automotive, fitness, and multi-chair salons.

**Gap:** Staff-only availability works for R1 wedge; vertical playbooks assume rooms/bays without a unified spec.

---

## 1. Model

```typescript
type BusinessResource = {
  id: string;
  businessId: string;
  kind: "room" | "bay" | "class_slot" | "equipment";
  name: string;
  capacity: number; // 1 for room/bay; N for class
  isActive: boolean;
};

type ServiceResourceRequirement = {
  serviceId: string;
  resourceKind: "room" | "bay" | "class_slot" | "equipment";
  quantity: number; // usually 1
};
```

Storage (R2): `business_resources` + join `service_resource_requirements`.

---

## 2. Booking guard

When `service.requiresResource`:

1. Resolve staff availability (existing).
2. Resolve resource availability for overlapping window.
3. Hold resource on `booking.created`; release on cancel/no-show.

Conflict message uses vertical vocabulary (`room`, `bay`, `spot`).

---

## 3. Vertical defaults

| Vertical | Default kind | Notes |
|----------|--------------|-------|
| medspa | room | Couples rooms = capacity 2 |
| allied-health | room | Same as medspa |
| automotive-detailing | bay | One vehicle per bay |
| fitness | class_slot | Class template + capacity |
| hair / beauty | optional chair | R3 — defer until partner |

---

## 4. Surfaces

| Surface | Behaviour |
|---------|-----------|
| **Owner settings** | CRUD resources; attach to services |
| **Calendar** | Optional resource lane (R3) |
| **Public book** | Hidden — customer picks time only |
| **Demo seed** | Medspa + detailing shops get ≥2 resources |

---

## 5. Related

- [`booking-guards` policy](../../../lib/policy/src/booking-guards.ts)
- [`medspa-procedures` policy](../../../lib/policy/src/medspa-procedures.ts)
- [`vertical-playbooks/medspa.md`](./vertical-playbooks/medspa.md)

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial resource inventory spec |
