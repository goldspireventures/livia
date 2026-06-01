# Allied health vertical — platform program (V7)

**Status:** program complete · **execution:** Phase V2  
**Registry:** V7 · **beta-full** · demo `motion-physio-cork`  
**Reads with:** [`vertical-playbooks/allied-health.md`](./vertical-playbooks/allied-health.md)

---

## L0 — What Livia means for allied health

Physio, chiro, OT-lite: **cadence of care** without becoming an EHR.

**One sentence:** *Livia is the appointment + continuity layer for practices — assessment, follow-ups, reminders, audit.*

### Wow — operator

| Moment | Why |
|--------|-----|
| **Plan rebook cadence** | “Due for follow-up” visible on client |
| **Assessment vs follow-up** | Service clarity — no wrong slot length |
| **Audit on notes** | Who edited — trust for principals |
| **Inbox triage** | Referral questions without losing thread |

### Wow — guest

| Moment | Why |
|--------|-----|
| **Book assessment** | Plain language, accessible |
| **Prep SMS** | What to wear, arrive early |
| **Optional intake** | Health questionnaire on token |
| **Visit hub** | Date, practitioner, location |

---

## L1 — Capability

| Layer | Status |
|-------|--------|
| Allied guards | ✅ |
| Intake token (optional) | ✅ |
| Vocabulary patient/practitioner | ✅ |

**Gaps:** insurer reference field; outcome metrics (out of scope).

---

## L2 — Presentation

Default: **`allied-clinic-standard`**. Professional sans; high legibility.

---

## L3 — Personas

Practitioner my-day back-to-back; owner utilisation; admin reception.

---

## L4 — Surfaces

Book · visit · intake optional. Customer detail for plan continuity.

**Fine details:** never diagnosis copy; cancellation policy for healthcare norms; GDPR on intake retention.

---

## L5 — Demo

`motion-physio-cork`: follow-up style bookings in expanded seed.

---

## L6 — CI

`all-verticals-smoke` motion owner

---

## L7 — Dedicated allied (scope)

| Bet | Scope |
|-----|--------|
| Home exercise plan links | R2 — not prescribing |
| Multi-practitioner practice | Roster |
| Telehealth block type | Partner |
| Claims export | Partner |

---

## L8 — Completion

Assessment book + client detail shows cadence + no medical advice in Liv strings.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial program |
