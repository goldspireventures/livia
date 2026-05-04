# Bliq Source of Truth

## Purpose

This is Bliq’s highest-level product and engineering constitution.

Cursor must read this before major work and follow it over any informal assumptions.

**Repo note:** Implementation **phase numbers** and the HTTP roadmap live in [`docs/BLIQ_BUILD_PLAN.md`](../BLIQ_BUILD_PLAN.md) Part **D**. Use [`BLIQ_PHASE_STATUS.md`](./BLIQ_PHASE_STATUS.md) for crosswalk from older “elite” numbering and current status.

---

## 1. What Bliq Is

Bliq is a mobile-first, multi-tenant operating platform for service businesses.

It is not:
- only a booking app
- only a barber app
- a single-niche tool
- a throwaway MVP

It is:
- a platform for running appointment/service businesses end-to-end

Long-term:

> Bliq becomes the operating system for service businesses.

---

## 2. Who Bliq Serves

Bliq must support many verticals:
- barbers
- salons
- nail techs
- lash techs
- tutors
- personal trainers
- tattoo artists
- consultants
- mechanics
- home service businesses
- mobile service providers
- other appointment-based businesses

Rule:
Never build domain logic that only works for barbers.

---

## 3. Core Platform Pillars

Bliq includes or will include:

1. Business setup and membership
2. Staff management
3. Service catalog
4. Availability and time off
5. Slot generation
6. Customer profiles and channel identity
7. Bookings
8. Payments and deposits
9. Notifications
10. Public booking pages
11. Storefronts
12. Messaging integrations
13. AI insights and ops intelligence
14. Platform operations and feature flags
15. Analytics and testing

---

## 4. Product Philosophy

Bliq should help a business:
- accept bookings
- manage customers
- manage staff
- collect deposits/payments
- communicate with customers
- show up online
- reduce manual admin
- eventually automate low-risk workflows

Bliq must feel:
- modern
- fast
- mobile-first
- simple
- premium
- trustworthy

---

## 5. Build Philosophy

Build Bliq as if it will power thousands of businesses.

Default to:
- correctness over speed
- clarity over cleverness
- scalable structure over shortcuts
- deterministic logic over AI guesses
- mobile-first over desktop-first
- provider abstraction over vendor lock-in
- tenant safety over convenience

---

## 6. Architecture Rules

### Service layer
Business logic lives in `src/services/*`.

### API routes
Routes are thin:
- parse
- validate
- call service
- return response

### Multi-tenancy
Tenant-owned data is scoped by `businessId`.

### Route style
Use tenant-nested APIs:

```text
/api/businesses/[businessId]/...
```

### Validation
Use Zod at route boundary and service validation for core rules.

### Events
Important actions emit events.

### Payments
Payments go through payment service/provider abstraction.

### AI
AI goes through shared AI client and is never source of truth.

---

## 7. Mobile + Web Requirement

Bliq is:
- web app
- iOS app later
- Android app later

Use a shared web codebase, but design all UX and APIs for mobile-first usage.

---

## 8. Current Execution Priority

Complete core booking loop before major expansion:

1. Staff/services
2. Availability/time off
3. Slot engine
4. Booking engine
5. Public booking flow
6. Dashboard

Do not prioritize advanced AI, messaging, storefronts, or native apps before the core booking loop is reliable.

---

## 9. AI Philosophy

AI is:
- assistive
- analytical
- observational
- recommendation-oriented

AI is not:
- authoritative
- destructive
- allowed to bypass deterministic validation
- allowed to modify critical data without policy/approval

---

## 10. Payment Philosophy

Stripe is first provider.

Mulah may become future financial layer.

Rules:
- no Stripe in booking service
- no card data stored
- no fake payment success
- provider abstraction required

---

## 11. Final Principle

When in doubt, ask:

> Would this still make sense if Bliq had 10,000 businesses using it?

If not, avoid the shortcut.