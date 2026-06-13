# Vertical playbook — Event vendors & decor (V12)

**Status:** Ring 2 doc-first (2026-06-10)  
**Program (L0–L8):** [`EVENT-VENDORS-VERTICAL-PROGRAM.md`](../EVENT-VENDORS-VERTICAL-PROGRAM.md)  
**Platform primitive:** [`CONSULT-FIRST-WORKFLOW-SPEC.md`](../CONSULT-FIRST-WORKFLOW-SPEC.md)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V12 · **defer** · no code enum yet

---

## 1. Operating reality

- Default loop is **enquiry → quote → book**, not instant slot book.
- Leads arrive on **IG/WhatsApp**; operator sends **one enquire link**.
- Every event is **date-bound**; pricing is often **bespoke** from a repeating catalogue.
- Solo operator works **from phone** between jobs.

---

## 2. Vocabulary

| Term | Value |
|------|-------|
| Customer | client / enquirer |
| Unit | event date |
| Offer | service (catalogue item) |
| Commitment | quote → accepted |
| Provider | stylist / vendor / owner |

---

## 3. Hero workflows

1. IG DM → enquire link → structured form → inbox **New**
2. Enquiry detail → **Generate quote** → tweak → send (email or WhatsApp one-tap)
3. Client opens quote link → **Accept** → operator marks **Booked**
4. Event day → **event-day sheet** on mobile

---

## 4. Guest surfaces (planned)

| Surface | Route | Required |
|---------|-------|----------|
| website lite | `{slug}.livia-hq.com` | ✅ home + gallery |
| enquire | `{slug}.livia-hq.com/enquire` | ✅ |
| quote view | `{slug}.livia-hq.com/q/:token` | ✅ Phase 2 |

---

## 5. UX posture

**Soft:** gallery-forward, celebration photography, warm copy  
**Bold:** pipeline counts, stale-quote reminders, budget flag on draft

---

## 6. Nearest packs (until enum)

| Pack | Borrow |
|------|--------|
| wellness | packages, couples contact, room/date metaphor |
| medspa | deposits, high consideration, intake |
| body-art | design proof → mood board approval |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-10 | Initial Ring 2 playbook |
