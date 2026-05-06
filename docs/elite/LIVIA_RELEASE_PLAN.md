# Livia Release Plan

## Purpose

This document separates build progress from release readiness.

Livia should not be marketed as production-ready just because code exists. Release maturity is staged.

---

## 1. Release Stages

### Stage 0 — Local Development

Goal:
- build core system locally
- validate schema/services/routes
- no real users

Requirements:
- build passes
- database connected
- core APIs smoke-tested

### Stage 1 — Internal Alpha

Goal:
- founder/operator tests Livia manually
- owner-operator persona
- fake or controlled bookings

Requirements:
- business setup works
- staff/services work
- availability works
- slots work
- booking works
- no double booking
- basic dashboard usable

### Stage 2 — Private Beta

Goal:
- 2–5 trusted businesses test real workflows

Requirements:
- auth implemented
- public booking flow live
- notifications baseline
- support/report issue route or manual support process
- basic monitoring
- backup/export awareness

### Stage 3 — Soft Launch

Goal:
- 10–25 businesses in one or two niches/locations

Requirements:
- payments stable if enabled
- Stripe webhook configured
- rate limiting for public endpoints
- clear refund/cancellation policy support
- onboarding flow
- mobile UX polished
- dashboard usable on phone
- basic support process

### Stage 4 — Paid Launch

Goal:
- charge businesses

Requirements:
- billing/subscription path
- production auth
- production database config
- monitoring/alerts
- privacy policy
- terms of service
- payment policies
- support workflow
- incident response process

### Stage 5 — Platform Expansion

Goal:
- storefronts, messaging, AI, automation, marketplace

Requirements:
- stable core booking engine
- analytics
- event catalog discipline
- feature flags
- platform ops controls
- stronger tests

---

## 2. First 90-Day Persona

Default persona:
- Owner-operator

Reason:
- validates real operational pain
- exposes mobile UX friction
- tests scheduling and booking edge cases directly
- reduces second-hand feedback errors

Evolution:
- Days 1–30: owner-operator only
- Days 31–60: owner-operator plus 1 extra staff scenario
- Days 61–90: hybrid owner-operator/owner-manager

---

## 3. MVP Release Scope

MVP must include:
- business creation
- membership/access
- staff
- services
- availability
- time off
- slot engine
- customer creation/resolution
- booking creation
- public booking page
- basic dashboard
- event logging
- basic notification attempt

MVP should not require:
- AI
- messaging integrations
- full storefront builder
- marketplace
- advanced payments
- native app store release

---

## 4. Beta Release Scope

Beta should include:
- real auth
- improved dashboard
- booking notifications
- basic payments/deposits if stable
- mobile responsive polish
- support/reporting workflow
- basic feature flags

---

## 5. Paid Release Scope

Paid release should include:
- billing/subscription
- stable payment policies
- reliable notifications
- onboarding polish
- privacy/terms
- production monitoring
- backup strategy
- incident response playbook

---

## 6. Launch Metrics

Track:
- businesses onboarded
- activation rate
- time to first booking link
- time to first booking
- bookings per business
- booking completion rate
- no-show rate
- public booking conversion
- payment/deposit success rate
- support tickets per business
- churn signals

---

## 7. Operational Readiness Checklist

Before real users:
- production env vars configured
- database reachable
- schema synced safely
- auth configured
- Stripe webhook configured if payments enabled
- public routes rate-limit ready
- error monitoring configured
- support channel defined
- data backup approach known

---

## 8. Do Not Launch Publicly If

- double booking can happen
- public booking flow is broken on mobile
- users can access another business’s data
- payment success can be faked
- webhook handling is unverified
- there is no support path
- terms/privacy/payment policy absent for paid/payment flows

---

## 9. Release Discipline

Every release should document:
- changes
- migrations
- risks
- rollback plan
- test results
- known limitations

Use small releases. Avoid giant uncontrolled changes.