# System-wide realignment program

> **Archived** — engineering complete (2026-05-22). **Active build:** [`OPERATION-SOLIDIFY.md`](./OPERATION-SOLIDIFY.md). See [`../archive/README.md`](../archive/README.md).

**Status:** **Engineering complete (2026-05-22)** — founder ops (Phase 6) remains  
**Owner:** founder + engineering  
**Spine:** [`../LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md)  
**Handoff:** [`ENGINEERING-HANDOFF.md`](./ENGINEERING-HANDOFF.md)

### Progress at a glance

| Phase | Engineering | Founder |
|-------|-------------|---------|
| 0 Alignment | ✅ | — |
| 1 Repo hygiene | ✅ (CI health informational) | — |
| 2 Code quality | ✅ P0; optional 2.7 stress deferred | — |
| 3 Surfaces | ✅ matrix green / ⏸ deferred | — |
| 4 UX craft | 🟡 persona/vocab in hot paths; full axe deferred v1.5 | Review copy in trials |
| 5 UAT | Scripts ready | Sign [`UAT-CERTIFICATION.md`](../testing/UAT-CERTIFICATION.md) |
| 6 Go-live | — | [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md) |

This is the **one final massive audit** — expanded into an executable program. It is not a single PR; it is the definition of “done” for Livia as company + product + repo until gates are green.

### Finality (read this once)

- **This document is the only active build plan.** Phases 0–6 are complete as a structure; task rows inside them update as work lands. We do not start parallel “master plans,” “final execution plans,” or new mega-audits.
- **Supporting docs** (alignment, idea-to-reality gaps, surface matrix, open-items deferred, launch-plan gates) are inputs and exit criteria — not competing roadmaps. Conflicts → [`DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md).
- **Done** = matrix + UAT signed + P0–P2 in-repo + P3 ops per [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md). Then this file gets status **Complete** and any *next* tranche (v1.5, scale) is a **new** program with a new name — not a silent rewrite of this one.

---

## North star

> **Every file in the repo either serves the global appointment-business OS, or it is removed, merged, or marked deprecated with a pointer.**

Salon/hair is **pack `hair`**, not the product name in code or copy.

---

## Phase 0 — Alignment (documentation truth)

**Goal:** One answer to who/what/how; no contradictory “done” claims.

| Task | Deliverable | Status |
|------|-------------|--------|
| 0.1 | [`LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md) | [x] |
| 0.2 | Reconcile “closed” audits vs Idea-to-Reality gaps | [x] |
| 0.3 | [`DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md) — which doc wins conflicts | [x] |
| 0.4 | Mark superseded docs at top (BUILD-BACKLOG, duplicate plans) | [x] |
| 0.5 | README + foundation index point to alignment first | [x] |

**Exit:** New engineer reads alignment → global system → idea-to-reality §I → knows exact gaps.

---

## Phase 1 — Repo hygiene (structure)

**Goal:** Clean tree; no accidental artifacts; sensible names.

| Task | Check | Status |
|------|-------|--------|
| 1.1 | `artifacts/api-server/dist/` not committed — `.gitignore` | [x] local only |
| 1.2 | No duplicate `.github/workflows` paths (Windows duplicates) | [x] |
| 1.3 | `pnpm inventory` → `SCREEN-INVENTORY.md` current | [x] run on release |
| 1.4 | Deprecated packages (`mockup-sandbox`) labeled in README | [x] |
| 1.5 | `scripts/repo-health-audit.mjs` run in CI optional | [x] |
| 1.6 | Consolidate duplicate product plans (MASTER vs DETAILED vs FINAL) — roles in DOC-CANONICAL-INDEX | [x] |

**Exit:** `node scripts/repo-health-audit.mjs` exits 0 (warnings documented).

---

## Phase 2 — Code quality (product grade)

**Goal:** No salon-only product strings; policy-driven copy; no obvious foot-guns.

| Track | Work | Status |
|-------|------|--------|
| 2.1 Copy | Grep `salon` in `artifacts/**` — tenant UI → neutral or `businessVocabulary` | [x] tenant UI; dev seed/marketing OK |
| 2.2 Policy | All onboarding/catalog from `listVerticalCatalog()` | [x] |
| 2.3 API | OpenAPI ↔ routes parity scan | [x] CI codegen guard |
| 2.4 Generated | Never edit `api-zod` / `api-client-react` by hand | [x] CI |
| 2.5 Liv | No new business logic in `ai-chat.service` strings — tools/policy | [x] existing architecture |
| 2.6 Performance | List endpoints paginated; N+1 audit on hot paths | [x] customers + bookings paginated |
| 2.7 Stress | k6 or artillery script for bookings list + inbox (optional) | [ ] v1.5 |

**Exit:** `pnpm typecheck` + `test:e2e:api` + naming taboo green.

---

## Phase 3 — Product surface completeness (IDEA-TO-REALITY §I.1)

**Goal:** API no longer ahead of UI.

| Entity | Web | Mobile | Priority |
|--------|-----|--------|----------|
| Customer | edit form on detail | edit | [x] |
| Booking | wizard + `/bookings/new` | parity actions | [x] |
| Service | inline edit | create + edit | [x] |
| Staff | full tabs | profile + services assign | [x] |
| Settings | persona-first IA | persona blocks + policy read | [x] |
| Lifecycle | page | mobile page | [x] |

Track in [`SURFACE-COMPLETION-MATRIX.md`](./SURFACE-COMPLETION-MATRIX.md) (created in this program).

**Exit:** Matrix all green or explicitly deferred with ADR.

---

## Phase 4 — UX / brand program

| Task | Status |
|------|--------|
| 4.1 Persona copy pass (rituals, not generic “Dashboard”) | [x] hot paths + vocabulary |
| 4.2 WCAG axe on 10 critical routes | [ ] v1.5 |
| 4.3 Responsive matrix per screen card | [x] existing screen cards |
| 4.4 Motion budget web ↔ mobile | [x] existing polish |
| 4.5 Marketing vs reality re-audit | [x] audits doc; G3 = founder |

---

## Phase 5 — Verification (UAT)

| Layer | Command / artifact |
|-------|-------------------|
| API | `pnpm test:e2e:api` |
| Web all personas | `pnpm e2e:contextual-web` |
| Web founder | `pnpm e2e:founder-checklist` |
| Mobile | `pnpm maestro:visual-capture` |
| Certification | [`testing/UAT-CERTIFICATION.md`](../testing/UAT-CERTIFICATION.md) updated |

**Exit:** UAT doc signed with date + screenshot folder.

---

## Phase 6 — Production gates (your lane + ours)

| Gate | Owner | Doc |
|------|-------|-----|
| G2 closed beta | Shared | `launch-plan.md` |
| G3 public | Founder ops | `OPEN-ITEMS-DEFERRED.md` |
| In-repo P0–P2 | Engineering | This program Phases 2–5 |

---

## Operating rules during the program

1. **No new “audit done” doc** without a matrix row turning green.
2. **Wording:** every user-facing string read aloud — would a tattoo studio owner feel insulted by “salon”?
3. **Commits:** one track per PR (`realign/copy`, `realign/customer-edit`, …).
4. **Weekly:** founder reviews `SURFACE-COMPLETION-MATRIX` + 5 screenshots.

---

## What “more than you asked” includes

- **SURFACE-COMPLETION-MATRIX** — living CRUD parity
- **DOC-CANONICAL-INDEX** — ends doc wars
- **repo-health-audit.mjs** — automated structure checks
- **PRODUCT-GRADE-BAR.md** — copy, perf, security checklist for PRs
- **Continued vertical demo shops** — proof not hair-only

---

## Timeline (suggested)

| Week | Focus |
|------|--------|
| 1 | Phase 0–1 + copy grep + customer edit |
| 2 | Phase 3 booking/staff/mobile |
| 3 | Phase 4–5 UAT full persona |
| 4 | Buffer + G2 prep |

Adjust with founder — program is the map, not a deadline fantasy.
