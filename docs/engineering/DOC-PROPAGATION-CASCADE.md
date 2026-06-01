# Documentation propagation cascade

**Status:** canonical (2026-06-01)  
**Audience:** founders, product, engineering, agents  
**Mirrors:** [`COMPOSABLE-EVOLUTION.md`](./COMPOSABLE-EVOLUTION.md) (code rings) · [`VERTICAL-ADD-PLAYBOOK.md`](./VERTICAL-ADD-PLAYBOOK.md) (vertical hub)

---

## 1. Problem

Livia’s **code** is designed to propagate from `lib/policy`. **Docs** can still silo: a vertical dissect lives in one file while UAT, demo logins, and build plans drift. That produces “we forgot to close X” at release.

**Goal:** Same discipline as code — **one hub per vertical (or platform change), spokes must link or CI fails.**

---

## 2. Two hubs

| Hub type | When | Canonical home |
|----------|------|----------------|
| **Platform** | Cross-cutting UX, presets, gateway | `EXPERIENCE-ARCHITECTURE.md`, `UI-UX-MASTER-PROGRAM.md`, `LIVIA-STATUS.md` |
| **Vertical** | One industry pack (beauty, medspa, …) | `docs/product/vertical-playbooks/{vertical}.md` + optional **`{VERTICAL}-VERTICAL-PROGRAM.md`** while that vertical is in active completion |

**Rule:** Do not duplicate long narrative in build plans. Build plans **link** to the program doc and track **exit gates** only.

---

## 3. Vertical doc spokes (must stay aligned)

When `codeVertical` or `demoSlug` changes in `vertical-coverage.ts`, update **all** of:

| Spoke | Path | What must match |
|-------|------|-----------------|
| Registry (code hub) | `lib/policy/src/vertical-coverage.ts` | `demoSlug`, `tier`, `codeVertical` |
| Playbook L2+L3 | `docs/product/vertical-playbooks/{vertical}.md` | Hero workflows, guest surfaces, vocabulary |
| Demo seed index | `docs/product/PER-VERTICAL-DEMO-SEED.md` | Slug + min depth |
| Demo logins | `docs/testing/DEMO-LOGINS.md` | Slug + **correct** vertical column |
| Public flow (if non-generic) | `docs/product/public-flows/{vertical}-*.md` | `/b` steps |
| Founder UAT | `docs/operations/FOUNDER-UAT-CHECKLIST.md` | Section for canonical demo tenant |
| Active program (if any) | `docs/product/{NAME}-VERTICAL-PROGRAM.md` | L0–L6 status + gap queue |
| Design assets | `docs/design/assets/w4-tenant/{vertical}/`, `w5-public/{vertical}/` | README + targets |
| Doc index | `docs/DOC-CANONICAL-INDEX.md` | One-line link when program active |
| Status | `docs/LIVIA-STATUS.md` | “Active work” row while vertical is focus |
| Track D / evolution | `PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md` | Pointer on relevant D6.x line — not a second spec |

**Code spokes** (already in `VERTICAL-ADD-PLAYBOOK.md`): policy Records, seed TS, E2E fixtures, `northstar-p0-registry` demoSlug.

---

## 4. Agent / PR discipline

Before closing a **vertical** or **preset** task:

1. **Local** — feature/doc you touched.  
2. **Hub** — playbook or program doc updated (status + changelog).  
3. **Spokes** — table in §3; run `pnpm vertical:doc-check`.  
4. **Platform** — if behaviour is category-wide, one sentence in `PEOPLE-BUSINESS-CATEGORY-MANIFESTO` or `EXPERIENCE-ARCHITECTURE` — not a new orphan doc.

**Do not** paste the full dissect into chat or into five build plans. **Do** update the program doc and links.

---

## 5. Vertical program docs (all code verticals)

Every `BusinessVertical` enum value has a **full program doc** — see [`VERTICAL-PROGRAMS-INDEX.md`](../product/VERTICAL-PROGRAMS-INDEX.md).

`pnpm vertical:doc-check` fails if any program file is missing, not linked from the index, or playbook does not link the program.

**Execution focus** (founder UAT / engineering) tracked in [`LIVIA-VERTICALS-BUILD-PLAN.md`](../product/LIVIA-VERTICALS-BUILD-PLAN.md) — Phase V1 heartland = hair + beauty.

---

## 6. Automated guard

```bash
pnpm vertical:doc-check   # also runs inside pnpm vertical:check
```

Fails if: playbook missing, demo slug absent from seed index/logins/seed TS, active program not in doc index, beauty UAT section missing.

**North-star:** extend check when a vertical gets `{NAME}-VERTICAL-PROGRAM.md` — add one line to `ACTIVE_VERTICAL_PROGRAMS` in `vertical-doc-propagation.test.ts`.

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial cascade + `vertical:doc-check` |
