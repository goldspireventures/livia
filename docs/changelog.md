# Changelog

**Status:** Living document. Every production deploy that touches a customer-visible surface lands a row.

This file is the source for `livia.io/changelog` per Brand B5 in `docs/launch-plan.md`.

## Format

Every entry:

```
## YYYY-MM-DD — <internal version> — <surface(s)>

- **Changed | Added | Fixed | Removed | Security | Deprecated**: <description>. (PR #N)
```

- Customer-visible language. No engineer jargon (no "refactored helper", no "bumped dependency").
- Group by date; multiple entries per day OK.
- Security-class entries published with appropriate disclosure timing per `docs/engineering/incident-response.md`.

---

## 2026-05-25 — OS Phase A — dashboard · api · mobile · docs · marketing

- **Removed**: Job board / Hiring from product — team growth is **Staff → Invite** only.
- **Changed**: Owner toolkit is now **Liv command** (briefing & tuning); duplicate Operations nav grid removed.
- **Added**: **Running late** on Today and booking detail (one appointment or all today); same on mobile long-press / booking screen.
- **Changed**: Leave — staff request for themselves; managers approve on Rota (not filed on behalf of staff).
- **Added**: Vertical theme tokens on web (nine verticals); lifecycle nav hidden until relevant.
- **Added**: Business **Operator ready pack** and starter templates (`docs/business/`); internal support runbook updated.

## 2026-05-07 — pre-v1 — foundation

- **Added**: Foundation documentation programme (F1–F10) complete; 17 ADRs published; roadmap v1 / v1.5 / v2 / v3 scopes locked.

## 2026-05-06 — pre-v1 — repo + brand

- **Changed**: Codename renamed to Livia across the repo (Task #38). May 2026: final product-code cleanup — legacy codename strings removed; CI guards reintroduction.
- **Added**: Demo readiness pass (Task #23). Demo flow ready end-to-end.

---

## 2026-05-22 — v3 — whole product (seven surfaces)

- **Added**: Booking continuity — SMS thread after web book, stuck queue, reference photos, German formal templates.
- **Added**: Medspa clinical hub — consent, intake review, public consent step; slot waitlist when appointments cancel.
- **Added**: DACH — Germany jurisdiction pack, `/de` on livia.io, regulatory footer on public booking.
- **Added**: Partner API v1 (read + create bookings); enterprise audit CSV export; internal continuity traces.
- **Added**: Pet profiles on customer records; running-late SMS broadcast for today's appointments.
- **Added**: France text pack; allied health vertical; design-proof approval workflow.

## 2026-05-22 — v3-in-progress — dashboard · api · public booking · policy

- **Added**: After online booking, clients get a text/email thread for style pics and confirmation — replaces “message us on Instagram” handoffs.
- **Added**: Pet grooming and automotive detailing vertical packs; payroll hours CSV export from rota (Studio+).
- **Added**: Owner toolkit surfaces for stuck bookings and booking continuity timeline.

---

## How this file gets used

- **Customer-facing changelog** at `livia.io/changelog` reads this file.
- **Release notes** in mobile + web update notifications source from here.
- **Founder Monday review** of `launch-plan.md` cross-checks: every Gate criterion that shipped has a changelog row.

## What we don't put here

- Internal infrastructure changes invisible to customers (e.g., "switched from X queue to Y queue") unless they explain a customer-visible improvement.
- Pre-merge work-in-progress.
- Documentation-only changes (those land in foundation audit notes).
- Eval threshold tweaks (those go in the evals dashboard).

## Versioning conventions

- Internal version (`v0.x` pre-v1; `v1.x` from v1 ship; etc.) per `docs/engineering/release-pipeline.md`.
- Marketing-facing version (v1, v1.5, v2, v3) per `docs/roadmap/`.
- Both surface in changelog rows when relevant.
