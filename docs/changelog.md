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

## 2026-05-07 — pre-v1 — foundation

- **Added**: Foundation documentation programme (F1–F10) complete; 17 ADRs published; roadmap v1 / v1.5 / v2 / v3 scopes locked.

## 2026-05-06 — pre-v1 — repo + brand

- **Changed**: Codename Bliq renamed to Livia across the repo. Surviving `bliq` strings are intentional legacy (mobile URL scheme, AsyncStorage migration shim, archived mockups).
- **Added**: Demo readiness pass (Task #23). Demo flow ready end-to-end.

---

(Future entries land below as we ship.)

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
